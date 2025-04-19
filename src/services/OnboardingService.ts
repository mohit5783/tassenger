import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../api/firebase/config";
import { sendOnboardingNotification } from "./NotificationService";

// Onboarding steps
export const ONBOARDING_STEPS = {
  WELCOME: "welcome",
  PROFILE_COMPLETION: "profile_completion",
  FIRST_TASK: "first_task",
  FIRST_CHAT: "first_chat",
  TASK_FEATURES: "task_features",
  CHAT_FEATURES: "chat_features",
  GROUPS_INTRO: "groups_intro",
  NOTIFICATIONS_SETUP: "notifications_setup",
  COMPLETED: "completed",
};

/**
 * Track user's onboarding progress
 * @param userId User ID
 * @param step Onboarding step completed
 */
export const trackOnboardingProgress = async (userId: string, step: string) => {
  try {
    const onboardingRef = doc(db, "users", userId, "onboarding", "progress");
    const onboardingSnap = await getDoc(onboardingRef);

    const progress = onboardingSnap.exists()
      ? onboardingSnap.data()
      : { steps: {} };

    // Update the step with completion timestamp
    progress.steps[step] = {
      completed: true,
      timestamp: Date.now(),
    };

    // Update the last step
    progress.lastStep = step;
    progress.lastUpdated = Date.now();

    await setDoc(onboardingRef, progress, { merge: true });
    return true;
  } catch (error) {
    console.error("Error tracking onboarding progress:", error);
    return false;
  }
};

/**
 * Get user's onboarding progress
 * @param userId User ID
 */
export const getOnboardingProgress = async (userId: string) => {
  try {
    const onboardingRef = doc(db, "users", userId, "onboarding", "progress");
    const onboardingSnap = await getDoc(onboardingRef);

    if (onboardingSnap.exists()) {
      return onboardingSnap.data();
    } else {
      // Initialize onboarding progress
      const initialProgress = {
        steps: {},
        lastStep: null,
        lastUpdated: Date.now(),
        started: Date.now(),
      };
      await setDoc(onboardingRef, initialProgress);
      return initialProgress;
    }
  } catch (error) {
    console.error("Error getting onboarding progress:", error);
    return null;
  }
};

/**
 * Send welcome notification to new user
 * @param userId User ID
 * @param userName User's name
 */
export const sendWelcomeNotification = async (
  userId: string,
  userName: string
) => {
  const title = "Welcome to Tassenger!";
  const message = `Hi ${
    userName || "there"
  }! Welcome to Tassenger. We're excited to help you manage your tasks and communications.`;

  await sendOnboardingNotification(userId, "welcome", title, message);
  await trackOnboardingProgress(userId, ONBOARDING_STEPS.WELCOME);
};

/**
 * Send feature discovery notification
 * @param userId User ID
 * @param feature Feature to highlight
 */
export const sendFeatureDiscoveryNotification = async (
  userId: string,
  feature: string
) => {
  let title = "";
  let message = "";

  switch (feature) {
    case "task_creation":
      title = "Create Your First Task";
      message =
        "Tap the + button in the Tasks tab to create your first task. You can set due dates, priorities, and more!";
      break;
    case "chat":
      title = "Start a Conversation";
      message =
        "Head to the Chat tab to start messaging with your contacts. You can share tasks and collaborate in real-time.";
      break;
    case "groups":
      title = "Create a Group";
      message =
        "Groups help you organize tasks and conversations with teams. Try creating one in the Groups tab!";
      break;
    case "recurring_tasks":
      title = "Set Up Recurring Tasks";
      message =
        "Did you know you can create tasks that repeat automatically? Try it when creating your next task!";
      break;
    default:
      title = "Discover Tassenger";
      message =
        "Explore all the features Tassenger has to offer to boost your productivity!";
  }

  await sendOnboardingNotification(userId, "feature_discovery", title, message);
  await trackOnboardingProgress(userId, `feature_discovery_${feature}`);
};

/**
 * Send productivity tip notification
 * @param userId User ID
 * @param tipId Tip ID
 */
export const sendProductivityTip = async (userId: string, tipId: number) => {
  const tips = [
    {
      title: "Task Priority Tip",
      message:
        "Use high priority for tasks that need immediate attention, and low priority for tasks that can wait.",
    },
    {
      title: "Group Tasks by Category",
      message:
        "Organizing tasks by category helps you focus on similar work at once, boosting your productivity.",
    },
    {
      title: "Set Realistic Due Dates",
      message:
        "Setting achievable deadlines helps you stay motivated and reduces stress.",
    },
    {
      title: "Use Task Dependencies",
      message:
        "For complex projects, set up task dependencies to ensure work is completed in the right order.",
    },
    {
      title: "Break Down Large Tasks",
      message:
        "Use subtasks to break down complex tasks into manageable pieces. It makes progress tracking easier.",
    },
  ];

  const tip = tips[tipId % tips.length];
  await sendOnboardingNotification(userId, "tip", tip.title, tip.message);
};

/**
 * Check if user needs onboarding notifications
 * @param userId User ID
 */
export const checkAndSendOnboardingNotifications = async (userId: string) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const progress = await getOnboardingProgress(userId);

    // If no progress exists or onboarding not started, send welcome notification
    if (!progress || !progress.steps[ONBOARDING_STEPS.WELCOME]) {
      await sendWelcomeNotification(userId, userData.displayName || "");
      return;
    }

    // Check which features to highlight based on user activity
    const lastStep = progress.lastStep;
    const now = Date.now();
    const daysSinceLastStep =
      (now - (progress.lastUpdated || now)) / (1000 * 60 * 60 * 24);

    // Don't send notifications too frequently
    if (daysSinceLastStep < 1) return;

    // Determine next step based on current progress
    if (!progress.steps[ONBOARDING_STEPS.FIRST_TASK]) {
      await sendFeatureDiscoveryNotification(userId, "task_creation");
    } else if (!progress.steps[ONBOARDING_STEPS.FIRST_CHAT]) {
      await sendFeatureDiscoveryNotification(userId, "chat");
    } else if (!progress.steps[ONBOARDING_STEPS.GROUPS_INTRO]) {
      await sendFeatureDiscoveryNotification(userId, "groups");
    } else if (!progress.steps[ONBOARDING_STEPS.TASK_FEATURES]) {
      await sendFeatureDiscoveryNotification(userId, "recurring_tasks");
    } else {
      // Send a random productivity tip
      const tipId = Math.floor(Math.random() * 5);
      await sendProductivityTip(userId, tipId);
    }
  } catch (error) {
    console.error("Error checking onboarding notifications:", error);
  }
};
