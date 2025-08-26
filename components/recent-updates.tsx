"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface ActivityUpdate {
  id: string
  status: string
  remarks: string
  updated_at: string
  activity: {
    title: string
    category: string
  }
  profile: {
    full_name: string
  }
}

export function RecentUpdates() {
  const [updates, setUpdates] = useState<ActivityUpdate[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchRecentUpdates()
  }, [])

  const fetchRecentUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from("activity_updates")
        .select(`
          *,
          activities!inner (
            title,
            category
          ),
          profiles!activity_updates_updated_by_fkey (
            full_name
          )
        `)
        .order("updated_at", { ascending: false })
        .limit(10)

      if (error) throw error

      const processedUpdates =
        data?.map((update: any) => ({
          id: update.id,
          status: update.status,
          remarks: update.remarks,
          updated_at: update.updated_at,
          activity: update.activities,
          profile: update.profiles,
        })) || []

      setUpdates(processedUpdates)
    } catch (error) {
      console.error("Error fetching recent updates:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading updates...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Recent Updates</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {updates.map((update) => (
            <div key={update.id} className="flex items-start space-x-3 p-3 border border-slate-200 rounded-lg">
              <div className="flex-shrink-0 mt-1">
                {update.status === "done" ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Clock className="w-5 h-5 text-orange-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-slate-800 truncate">{update.activity.title}</p>
                  <Badge variant="outline" className="text-xs">
                    {update.activity.category}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant={update.status === "done" ? "default" : "secondary"}
                    className={`text-xs ${update.status === "done" ? "bg-green-100 text-green-800" : ""}`}
                  >
                    {update.status}
                  </Badge>
                  <span className="text-xs text-slate-500">by {update.profile.full_name}</span>
                  <span className="text-xs text-slate-500">
                    {formatDistanceToNow(new Date(update.updated_at), { addSuffix: true })}
                  </span>
                </div>
                {update.remarks && (
                  <div className="flex items-start gap-1 mt-2">
                    <MessageSquare className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-600">{update.remarks}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {updates.length === 0 && <div className="text-center py-8 text-slate-500">No recent updates found.</div>}
        </div>
      </CardContent>
    </Card>
  )
}
