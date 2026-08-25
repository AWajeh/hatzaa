const COPY = {
  he: {
    verifyTitle: "אימות כתובת האימייל שלך",
    verifyBody: "קוד האימות שלך ל-הצעה הוא:",
    resetTitle: "איפוס סיסמה",
    resetBody: "קוד לאיפוס הסיסמה שלך ב-הצעה הוא:",
    expiry: "הקוד תקף ל-10 דקות. אם לא ביקשתם זאת, אפשר להתעלם מהודעה זו.",
    dir: "rtl" as const,
  },
  ar: {
    verifyTitle: "تأكيد بريدك الإلكتروني",
    verifyBody: "رمز التحقق الخاص بك في הצעה هو:",
    resetTitle: "إعادة تعيين كلمة المرور",
    resetBody: "رمز إعادة تعيين كلمة المرور الخاص بك في הצעה هو:",
    expiry: "الرمز صالح لمدة 10 دقائق. إذا لم تطلب هذا، يمكنك تجاهل هذه الرسالة.",
    dir: "rtl" as const,
  },
  en: {
    verifyTitle: "Verify your email",
    verifyBody: "Your Hatzaa verification code is:",
    resetTitle: "Reset your password",
    resetBody: "Your Hatzaa password reset code is:",
    expiry: "This code is valid for 10 minutes. If you didn't request this, you can ignore this email.",
    dir: "ltr" as const,
  },
};

function wrap(dir: "rtl" | "ltr", title: string, body: string, code: string, expiry: string) {
  return `<div dir="${dir}" style="font-family:system-ui,-apple-system,sans-serif;max-width:420px;margin:0 auto;padding:32px 24px;">
    <h1 style="font-size:18px;color:#1a1d24;margin:0 0 16px;">${title}</h1>
    <p style="font-size:14px;color:#6b7280;margin:0 0 16px;">${body}</p>
    <p style="font-size:32px;font-weight:700;letter-spacing:6px;color:#2f5ce0;margin:0 0 16px;">${code}</p>
    <p style="font-size:12px;color:#9ca3af;margin:0;">${expiry}</p>
  </div>`;
}

export function verificationEmailHtml(code: string, locale: string) {
  const c = COPY[locale as keyof typeof COPY] ?? COPY.he;
  return wrap(c.dir, c.verifyTitle, c.verifyBody, code, c.expiry);
}

export function passwordResetEmailHtml(code: string, locale: string) {
  const c = COPY[locale as keyof typeof COPY] ?? COPY.he;
  return wrap(c.dir, c.resetTitle, c.resetBody, code, c.expiry);
}
