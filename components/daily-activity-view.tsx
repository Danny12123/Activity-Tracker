"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, CheckCircle, Clock, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react"
import { format, startOfDay, endOfDay, addDays, subDays } from "date-fns"

interface DailyUpdate {
  id: string
  status: string
  remarks: string
  updated_at: string
  activity: {
    id: string
    title: string
    category: string
  }
  profile: {
    full_name: string
  }
}

export function DailyActivityView() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [updates, setUpdates] = useState<DailyUpdate[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchDailyUpdates()
  }, [selectedDate])

  const fetchDailyUpdates = async () => {
    setLoading(true)
    try {
      const startDate = startOfDay(selectedDate)
      const endDate = endOfDay(selectedDate)

      const { data, error } = await supabase
        .from("activity_updates")
        .select(`
          *,
          activities!inner (
            id,
            title,
            category
          ),
          profiles!activity_updates_updated_by_fkey (
            full_name
          )
        `)
        .gte("updated_at", startDate.toISOString())
        .lte("updated_at", endDate.toISOString())
        .order("updated_at", { ascending: false })

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
      console.error("Error fetching daily updates:", error)
    } finally {
      setLoading(false)
    }
  }

  const goToPreviousDay = () => {
    setSelectedDate((prev) => subDays(prev, 1))
  }

  const goToNextDay = () => {
    setSelectedDate((prev) => addDays(prev, 1))
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const groupUpdatesByActivity = (updates: DailyUpdate[]) => {
    const grouped: { [key: string]: DailyUpdate[] } = {}
    updates.forEach((update) => {
      const activityId = update.activity.id
      if (!grouped[activityId]) {
        grouped[activityId] = []
      }
      grouped[activityId].push(update)
    })
    return grouped
  }

  const groupedUpdates = groupUpdatesByActivity(updates)

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Daily Activity View
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousDay}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextDay}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="text-lg font-medium text-slate-700">{format(selectedDate, "EEEE, MMMM d, yyyy")}</div>
        </CardHeader>
      </Card>

      {/* Activity Updates */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Updates for {format(selectedDate, "MMM d, yyyy")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading daily updates...</div>
          ) : Object.keys(groupedUpdates).length === 0 ? (
            <div className="text-center py-8 text-slate-500">No activity updates found for this date.</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedUpdates).map(([activityId, activityUpdates]) => {
                const activity = activityUpdates[0].activity
                const latestUpdate = activityUpdates[0] // Already sorted by updated_at desc

                return (
                  <div key={activityId} className="border border-slate-200 rounded-lg p-4">
                    {/* Activity Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-800 mb-2">{activity.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {activity.category}
                          </Badge>
                          <Badge
                            variant={latestUpdate.status === "done" ? "default" : "secondary"}
                            className={`text-xs ${latestUpdate.status === "done" ? "bg-green-100 text-green-800" : ""}`}
                          >
                            {latestUpdate.status === "done" ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <Clock className="w-3 h-3 mr-1" />
                            )}
                            Current: {latestUpdate.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Update Timeline */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-slate-700">
                        Updates Timeline ({activityUpdates.length} update{activityUpdates.length !== 1 ? "s" : ""})
                      </h4>
                      {activityUpdates.map((update, index) => (
                        <div key={update.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg">
                          <div className="flex-shrink-0 mt-1">
                            {update.status === "done" ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Clock className="w-4 h-4 text-orange-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant={update.status === "done" ? "default" : "secondary"}
                                className={`text-xs ${update.status === "done" ? "bg-green-100 text-green-800" : ""}`}
                              >
                                {update.status}
                              </Badge>
                              <span className="text-xs text-slate-600">by {update.profile.full_name}</span>
                              <span className="text-xs text-slate-500">
                                at {format(new Date(update.updated_at), "h:mm a")}
                              </span>
                            </div>
                            {update.remarks && (
                              <div className="flex items-start gap-1 mt-2">
                                <MessageSquare className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-slate-600">{update.remarks}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
