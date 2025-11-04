import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateSettingsSchema = z.object({
    chatModel: z.string().optional(),
    summarizationModel: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const [userData] = await db
            .select({
                chatModel: user.chatModel,
                summarizationModel: user.summarizationModel,
            })
            .from(user)
            .where(eq(user.id, session.user.id));

        if (!userData) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(userData);
    } catch (error) {
        console.error("Error fetching user settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await auth.api.getSession({ headers: request.headers });

        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validationResult = updateSettingsSchema.safeParse(body);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: "Invalid request body", details: validationResult.error },
                { status: 400 }
            );
        }

        const updateData: Record<string, string> = {};
        if (validationResult.data.chatModel) {
            updateData.chatModel = validationResult.data.chatModel;
        }
        if (validationResult.data.summarizationModel) {
            updateData.summarizationModel = validationResult.data.summarizationModel;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: "No fields to update" },
                { status: 400 }
            );
        }

        const [updatedUser] = await db
            .update(user)
            .set({
                ...updateData,
                updatedAt: new Date(),
            })
            .where(eq(user.id, session.user.id))
            .returning({
                chatModel: user.chatModel,
                summarizationModel: user.summarizationModel,
            });

        if (!updatedUser) {
            return NextResponse.json(
                { error: "Failed to update settings" },
                { status: 500 }
            );
        }

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("Error updating user settings:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
