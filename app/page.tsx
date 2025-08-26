import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-slate-800">NPONTU Activity Tracker</CardTitle>
            <CardDescription className="text-slate-600">Application Support Team Portal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-4">
              <p className="text-sm text-slate-600">
                Track daily activities, manage team updates, and generate comprehensive reports for your application
                support operations.
              </p>

              <div className="space-y-2">
                <Link href="/auth/login" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Sign In to Portal</Button>
                </Link>

                <Link href="/auth/signup" className="block">
                  <Button variant="outline" className="w-full bg-transparent">
                    Create New Account
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
