
import * as admin from "firebase-admin";
import {onUserCreate, HttpsError} from "firebase-functions/v2/auth";
import {onCall} from "firebase-functions/v2/https";
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

  // The 'role' is now passed from the client during sign-up.
  // We access it through custom claims which we will set via a callable function.
  // We'll default it to 'student' here as a fallback, but the callable function is the primary source.
  const role = user.customClaims?.role || 'student';

  const userProfile = {
    id: uid,
    email: email || "",
    username: generateUsername(email),
    firstName: displayName?.split(" ")[0] || "",
    lastName: displayName?.split(" ").slice(1).join(" ") || "",
    photoURL: photoURL || "",
    role: role,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await admin.firestore().collection("userProfiles").doc(uid).set(userProfile);
    logger.info(`Successfully created profile for user: ${uid} with role: ${role}`);
  } catch (error) {
    logger.error(`Error creating profile for user: ${uid}`, error);
    // Optionally, you could delete the user from Auth to ensure consistency
    // await admin.auth().deleteUser(uid);
  }
});


/**
 * A callable function to set a user's role via custom claims right after sign-up.
 */
export const setInitialUserRole = onCall(async (request) => {
  const { uid, role } = request.data;
  
  if (!uid || !role) {
    throw new HttpsError('invalid-argument', 'The function must be called with "uid" and "role" arguments.');
  }

  // Ensure the role is one of the allowed values
  if (!['student', 'institute'].includes(role)) {
    throw new HttpsError('invalid-argument', 'Role must be either "student" or "institute".');
  }

  try {
    // Set custom user claims on the user account.
    await admin.auth().setCustomUserClaims(uid, { role: role });
    
    // Also update the Firestore document for consistency.
    await admin.firestore().collection('userProfiles').doc(uid).update({ role: role });

    logger.info(`Successfully set role '${role}' for user ${uid}.`);
    return { success: true, message: `Role '${role}' has been set.` };
  } catch (error) {
    logger.error(`Error setting role for user ${uid}:`, error);
    throw new HttpsError('internal', 'Unable to set user role.');
  }
});
