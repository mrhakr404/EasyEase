
import * as admin from "firebase-admin";
import {onUserCreate} from "firebase-functions/v2/auth";
import {setGlobalOptions} from "firebase-functions";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Set global options for all functions
setGlobalOptions({maxInstances: 10});

// Function to generate a username from an email
const generateUsername = (email: string | undefined): string => {
    if (!email) {
        // fallback for users without email, e.g. anonymous auth
        return `user_${Math.random().toString(36).substring(2, 10)}`;
    }
    return email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 100);
}


/**
 * Triggered when a new user is created.
 * Creates a corresponding user profile in Firestore.
 */
export const createProfile = onUserCreate(async (event) => {
  const user = event.data;
  const {uid, email, displayName, photoURL} = user;

  // Default role is 'student'. In a real app, this could be
  // determined by email domain, a custom claim, etc.
  const role = "student";

  const userProfile = {
    id: uid,
    email: email || "",
    username: generateUsername(email),
    firstName: displayName?.split(" ")[0] || "",
    lastName: displayName?.split(" ").slice(1).join(" ") || "",
    photoURL: photoURL || "",
    role: role, // Ensure role is always set
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await admin.firestore().collection("userProfiles").doc(uid).set(userProfile);
    logger.info(`Successfully created profile for user: ${uid}`);
    return null;
  } catch (error) {
    logger.error(`Error creating profile for user: ${uid}`, error);
    // Optionally, you could delete the user from Auth to ensure consistency
    // await admin.auth().deleteUser(uid);
    return null;
  }
});

    

    