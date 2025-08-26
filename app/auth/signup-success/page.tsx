import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-800">Account Created Successfully</CardTitle>
            <CardDescription className="text-slate-600">Please check your email to verify your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-sm text-slate-600">
                We've sent a verification email to your inbox. Please click the verification link to activate your
                account and access the Application Support portal.
              </p>
              <p className="text-xs text-slate-500">If you don't see the email, please check your spam folder.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
