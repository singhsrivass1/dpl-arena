"use client";

export default function Toast({ message }: { message: string | null }) {
  return (
    <div className={`success-toast ${message ? "show" : ""}`}>
      ✓ <span>{message}</span>
    </div>
  );
}
