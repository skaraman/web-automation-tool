import { Bucket } from "encore.dev/storage/objects";

export const screenshotBucket = new Bucket("automation-screenshots", {
  public: true,
});
