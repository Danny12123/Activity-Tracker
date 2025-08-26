"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Clock, MessageSquare, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Activity {
  id: string
  title: string
  description: string
  category: string
  created_at: string
  latest_status?: string
  latest_update?: string
  latest_remarks?: string
  updated_by_name?: string
}

export function ActivityOverview() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [newActivity, setNewActivity] = useState({
    title: "",
    description: "",
    category: "General",
  })
  const [isAddingActivity, setIsAddingActivity] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<{ [key: string]: string }>({})
  const [updateRemarks, setUpdateRemarks] = useState<{ [key: string]: string }>({})
  const [updatingActivities, setUpdatingActivities] = useState<Set<string>>(new Set())

  const supabase = createClient()

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      // Get activities with their latest updates
      const { data, error } = await supabase
        .from("activities")
        .select(`
          *,
          activity_updates (
            status,
            remarks,
            updated_at,
            profiles!activity_updates_updated_by_fkey (
              full_name
            )
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Process the data to get the latest update for each activity
      const processedActivities =
        data?.map((activity: any) => {
          const latestUpdate = activity.activity_updates?.sort(
            (a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
          )[0]

          return {
            ...activity,
            latest_status: latestUpdate?.status || "pending",
            latest_update: latestUpdate?.updated_at,
            latest_remarks: latestUpdate?.remarks,
            updated_by_name: latestUpdate?.profiles?.full_name,
          }
        }) || []

      setActivities(processedActivities)
    } catch (error) {
      console.error("Error fetching activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddActivity = async () => {
    if (!newActivity.title.trim()) return

    setIsAddingActivity(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { error } = await supabase.from("activities").insert({
        title: newActivity.title,
        description: newActivity.description,
        category: newActivity.category,
        created_by: user.id,
      })

      if (error) throw error

      setNewActivity({ title: "", description: "", category: "General" })
      fetchActivities()
    } catch (error) {
      console.error("Error adding activity:", error)
    } finally {
      setIsAddingActivity(false)
    }
  }

  const handleUpdateActivity = async (activityId: string) => {
    const status = updateStatus[activityId]
    const remarks = updateRemarks[activityId]

    if (!status) return

    setUpdatingActivities((prev) => new Set(prev).add(activityId))

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from("activity_updates").insert({
        activity_id: activityId,
        updated_by: user.id,
        status,
        remarks: remarks || null,
      })

      if (error) throw error

      // Clear the form
      setUpdateStatus((prev) => ({ ...prev, [activityId]: "" }))
      setUpdateRemarks((prev) => ({ ...prev, [activityId]: "" }))

      fetchActivities()
    } catch (error) {
      console.error("Error updating activity:", error)
    } finally {
      setUpdatingActivities((prev) => {
        const newSet = new Set(prev)
        newSet.delete(activityId)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading activities...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">Today's Activities</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Activity
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Activity</DialogTitle>
              <DialogDescription>Create a new activity for the team to track.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Activity Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Daily SMS count in comparison to SMS count from logs"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity((prev) => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the activity..."
                  value={newActivity.description}
                  onChange={(e) => setNewActivity((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newActivity.category}
                  onValueChange={(value) => setNewActivity((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Monitoring">Monitoring</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="Performance">Performance</SelectItem>
                    <SelectItem value="Troubleshooting">Troubleshooting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddActivity}
                disabled={isAddingActivity || !newActivity.title.trim()}
                className="w-full"
              >
                {isAddingActivity ? "Adding..." : "Add Activity"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
          {activities.map((activity) => (
            <div key={activity.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-800">{activity.title}</h3>
                  <p className="text-sm text-slate-600 mt-1">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {activity.category}
                    </Badge>
                    <Badge
                      variant={activity.latest_status === "done" ? "default" : "secondary"}
                      className={activity.latest_status === "done" ? "bg-green-100 text-green-800" : ""}
                    >
                      {activity.latest_status === "done" ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <Clock className="w-3 h-3 mr-1" />
                      )}
                      {activity.latest_status || "pending"}
                    </Badge>
                  </div>
                  {activity.latest_remarks && (
                    <div className="mt-2 p-2 bg-slate-50 rounded text-sm">
                      <MessageSquare className="w-3 h-3 inline mr-1" />
                      {activity.latest_remarks}
                      {activity.updated_by_name && (
                        <span className="text-slate-500 ml-2">- {activity.updated_by_name}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Update Form */}
              {/* <div className="border-t pt-3 space-y-3">
                <div className="flex gap-2">
                  <select
                    className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                    value={updateStatus[activity.id] || ""}
                    onChange={(e) => setUpdateStatus((prev) => ({ ...prev, [activity.id]: e.target.value }))}
                  >
                    <option value="">Update status...</option>
                    <option value="pending">Pending</option>
                    <option value="done">Done</option>
                  </select>
                  <Button
                    size="sm"
                    onClick={() => handleUpdateActivity(activity.id)}
                    disabled={!updateStatus[activity.id] || updatingActivities.has(activity.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {updatingActivities.has(activity.id) ? "Updating..." : "Update"}
                  </Button>
                </div>
                <Textarea
                  placeholder="Add remarks (optional)..."
                  value={updateRemarks[activity.id] || ""}
                  onChange={(e) => setUpdateRemarks((prev) => ({ ...prev, [activity.id]: e.target.value }))}
                  className="text-sm"
                  rows={2}
                />
              </div> */}
            </div>
          ))}

          {activities.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No activities found. Add your first activity to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
