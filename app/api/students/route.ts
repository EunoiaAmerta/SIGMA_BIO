export const dynamic = "force-dynamic";

const GOOGLE_SHEETS_API =
  "https://script.google.com/macros/s/AKfycbwZ-3w-pZsWwalaevZzfbVa1ukMuxbuXqxCAfKziEQMej49y2z1xQ1h6QH9av3EyiD0/exec";

export async function GET(req: Request) {
  try {
    // Ambil parameter dari query string
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const nisn = searchParams.get("nisn");
    const semester = searchParams.get("semester");

    if (!email || !nisn) {
      return Response.json(
        { error: "Missing email or nisn in query string" },
        { status: 400 }
      );
    }

    let googleScriptUrl = `https://script.google.com/macros/s/AKfycbwZ-3w-pZsWwalaevZzfbVa1ukMuxbuXqxCAfKziEQMej49y2z1xQ1h6QH9av3EyiD0/exec?action=getStudentData&email=${email}&nisn=${nisn}`;
    if (semester) {
      googleScriptUrl += `&semester=${semester}`;
    }
    console.log("[route.ts] Fetching from Google Script URL:", googleScriptUrl);

    const response = await fetch(googleScriptUrl, {
      method: "GET",
      redirect: "follow", // PENTING: Google Apps Script butuh 'follow' karena mereka melakukan redirect
      headers: {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0", // Tetap gunakan agar tidak diblok Google
      },
      cache: "no-store", // Optional: agar data selalu fresh
    });

    if (!response.ok) {
      throw new Error(`Google API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return Response.json(data);
  } catch (error) {
    console.error("Fetch error detail:", error);
    return Response.json(
      { error: "Gagal menyambung ke database Google" },
      { status: 500 }
    );
  }
}
