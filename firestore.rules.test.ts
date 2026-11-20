import { readFileSync } from "node:fs";
import { describe, it, beforeAll, afterAll, beforeEach } from "vitest";
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
} from "@firebase/rules-unit-testing";
import { doc, setDoc, updateDoc, serverTimestamp, writeBatch } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

describe("Antena Interdimensional Firestore Security Rules - Dirty Dozen", () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "utility-sunbeam-r07pf",
      firestore: {
        rules: readFileSync("firestore.rules", "utf8"),
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const db = ctx.firestore();
      await setDoc(doc(db, "site_stats", "global"), {
        count: 303,
        realVerifiedCount: 0,
        lastVisitId: "init_seed",
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, "guestbook_entries", "g_1"), {
        title: "Hola",
        author: "Visitante",
        location: "Madrid",
        recommend: "Sí, lo recomiendo",
        rating: 5,
        content: "Muy buen sitio.",
        votesCount: 0,
        commentsCount: 0,
        lastInteractionId: "initial",
        createdAt: serverTimestamp(),
      });
    });
  });

  it("1. Rejects unlinked visit_events creation without atomic site_stats update", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(db, "visit_events", "fake_1"), {
        device: "Chrome",
        host: "example.com",
        path: "/",
        sessionHash: "abc123",
        createdAt: serverTimestamp(),
      })
    );
  });

  it("2. Rejects counter inflation jump on site_stats/global", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      updateDoc(doc(db, "site_stats", "global"), {
        count: 99999,
        realVerifiedCount: 999,
        lastVisitId: "v_hack",
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("3. Rejects ghost fields (Shadow Update) on visit_events", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    const batch = writeBatch(db);
    batch.set(doc(db, "visit_events", "v_ghost"), {
      device: "Chrome",
      host: "example.com",
      path: "/",
      sessionHash: "abc123",
      isAdmin: true,
      createdAt: serverTimestamp(),
    });
    batch.update(doc(db, "site_stats", "global"), {
      count: 304,
      realVerifiedCount: 1,
      lastVisitId: "v_ghost",
      updatedAt: serverTimestamp(),
    });
    await assertFails(batch.commit());
  });

  it("4. Rejects client timestamp forgery on guestbook_entries", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(db, "guestbook_entries", "g_forge"), {
        title: "Hola",
        author: "Tester",
        location: "Web",
        recommend: "Sí, lo recomiendo",
        rating: 5,
        content: "Probando timestamp falso",
        votesCount: 0,
        commentsCount: 0,
        lastInteractionId: "initial",
        createdAt: new Date("2020-01-01T00:00:00Z"),
      })
    );
  });

  it("5. Rejects pre-inflated votesCount on guestbook creation", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(db, "guestbook_entries", "g_inflated"), {
        title: "Hola",
        author: "Tester",
        location: "Web",
        recommend: "Sí, lo recomiendo",
        rating: 5,
        content: "Votos falsos",
        votesCount: 500,
        commentsCount: 0,
        lastInteractionId: "initial",
        createdAt: serverTimestamp(),
      })
    );
  });

  it("6. Rejects oversized ID poisoning on guestbook_entries", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    const badId = "a".repeat(200);
    await assertFails(
      setDoc(doc(db, "guestbook_entries", badId), {
        title: "Hola",
        author: "Tester",
        location: "Web",
        recommend: "Sí, lo recomiendo",
        rating: 5,
        content: "ID gigante",
        votesCount: 0,
        commentsCount: 0,
        lastInteractionId: "initial",
        createdAt: serverTimestamp(),
      })
    );
  });

  it("7. Rejects oversized content payload (Denial of Wallet)", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(db, "guestbook_entries", "g_big"), {
        title: "Hola",
        author: "Tester",
        location: "Web",
        recommend: "Sí, lo recomiendo",
        rating: 5,
        content: "x".repeat(5000),
        votesCount: 0,
        commentsCount: 0,
        lastInteractionId: "initial",
        createdAt: serverTimestamp(),
      })
    );
  });

  it("8. Rejects orphaned comment without parent guestbook entry", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(db, "guestbook_entries", "missing_parent", "comments", "c_1"), {
        author: "Tester",
        content: "Huérfano",
        createdAt: serverTimestamp(),
      })
    );
  });

  it("9. Rejects desynchronized comment creation without updating parent commentsCount", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(db, "guestbook_entries", "g_1", "comments", "c_desync"), {
        author: "Tester",
        content: "Sin incrementar contador",
        createdAt: serverTimestamp(),
      })
    );
  });

  it("10. Rejects tampering immutable content on guestbook_entries", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      updateDoc(doc(db, "guestbook_entries", "g_1"), {
        content: "Texto adulterado",
      })
    );
  });

  it("11. Rejects spoofed admin email with email_verified: false", async () => {
    const db = testEnv
      .authenticatedContext("spoof_uid", {
        email: "tarotistasonline@gmail.com",
        email_verified: false,
      })
      .firestore();
    await assertFails(
      updateDoc(doc(db, "site_stats", "global"), {
        count: 9999,
        realVerifiedCount: 0,
        lastVisitId: "spoof",
        updatedAt: serverTimestamp(),
      })
    );
  });

  it("12. Rejects unauthorized write to /admins collection", async () => {
    const db = testEnv
      .authenticatedContext("attacker_uid", {
        email: "attacker@example.com",
        email_verified: true,
      })
      .firestore();
    await assertFails(
      setDoc(doc(db, "admins", "attacker_uid"), {
        email: "attacker@example.com",
        createdAt: serverTimestamp(),
      })
    );
  });
});
