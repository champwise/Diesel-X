import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";

// Import and register all Inngest functions here
// import { autoCreateMaintenance } from "@/lib/inngest/functions/auto-create-maintenance";
// import { sendTaskNotification } from "@/lib/inngest/functions/send-task-notification";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    // autoCreateMaintenance,
    // sendTaskNotification,
  ],
});
