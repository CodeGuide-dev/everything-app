import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const generatedImages = pgTable("generated_images", {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    imageUrl: text("image_url").notNull(),
    model: text("model").notNull(),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
}, (table) => ({
    userIdIdx: index("generated_images_user_id_idx").on(table.userId),
    createdAtIdx: index("generated_images_created_at_idx").on(table.createdAt),
}));
