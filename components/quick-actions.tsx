"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart3, Calendar, FileText, Users } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Link href="/activities" className="block">
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <FileText className="w-4 h-4 mr-2" />
            Manage Activities
          </Button>
        </Link>

        <Link href="/reports" className="block">
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <BarChart3 className="w-4 h-4 mr-2" />
            View Reports
          </Button>
        </Link>

        <Link href="/daily-view" className="block">
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <Calendar className="w-4 h-4 mr-2" />
            Daily Activity View
          </Button>
        </Link>

        <Link href="/team" className="block">
          <Button variant="outline" className="w-full justify-start bg-transparent">
            <Users className="w-4 h-4 mr-2" />
            Team Management
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
