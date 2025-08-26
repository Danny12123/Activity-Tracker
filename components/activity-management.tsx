"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { format } from "date-fns"

interface Activity {
  id: string
  title: string
  description: string
  status: "pending" | "done"
  created_at: string
  updated_at: string
  created_by: string
  profiles: {
    full_name: string
  }
}

interface ActivityUpdate {
  id: string
  activity_id: string
  status: "pending" | "done"
  remarks: string
  updated_at: string
  updated_by: string
  profiles: {
    full_name: string
  }
}

export function ActivityManagement() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [activityUpdates, setActivityUpdates] = useState<ActivityUpdate[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateActivity, setIsCreateActivity] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [newActivity, setNewActivity] = useState({
    title: "",
    description: "",
    category: "General",
  })
  const [updateForm, setUpdateForm] = useState({ status: "", remarks: "" })

  const supabase = createClient()

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("activities")
        .select(`
          *,
          profiles:created_by (full_name)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error("Error fetching activities:", error)
      setError("Failed to load activities")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchActivityUpdates = async (activityId: string) => {
    try {
      const { data, error } = await supabase
        .from("activity_updates")
        .select(`
          *,
          profiles:updated_by (full_name)
        `)
        .eq("activity_id", activityId)
        .order("updated_at", { ascending: false })

      if (error) throw error
      setActivityUpdates(data || [])
    } catch (error) {
      console.error("Error fetching activity updates:", error)
    }
  }

  const createActivity = async () => {
    try {
      setIsCreateActivity(true);
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const { error } = await supabase.from("activities").insert([
        {
          title: newActivity.title,
          description: newActivity.description,
          category: newActivity.category,
          status: "pending",
          created_by: user.id,
        },
      ])

      if (error) throw error

      setNewActivity({ title: "", description: "", category: "General" })
      setIsCreateDialogOpen(false)
      fetchActivities()
       setIsCreateActivity(false);
    } catch (error) {
      setIsCreateActivity(false);
      console.error("Error creating activity:", error)
      setError("Failed to create activity")
    }
  }

  const updateActivity = async () => {
    if (!selectedActivity) return

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      // Insert activity update
      const { error: updateError } = await supabase.from("activity_updates").insert([
        {
          activity_id: selectedActivity.id,
          status: updateForm.status as "pending" | "done",
          remarks: updateForm.remarks,
          updated_by: user.id,
        },
      ])

      if (updateError) throw updateError

      // Update activity status
      const { error: activityError } = await supabase
        .from("activities")
        .update({
          status: updateForm.status as "pending" | "done",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedActivity.id)

      if (activityError) throw activityError

      setUpdateForm({ status: "", remarks: "" })
      setIsUpdateDialogOpen(false)
      setSelectedActivity(null)
      fetchActivities()
    } catch (error) {
      console.error("Error updating activity:", error)
      setError("Failed to update activity")
    }
  }

  const handleViewActivity = (activity: Activity) => {
    setSelectedActivity(activity)
    setUpdateForm({ status: activity.status, remarks: "" })
    fetchActivityUpdates(activity.id)
    setIsUpdateDialogOpen(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "done":
        return <Badge className="bg-green-100 capitalize text-green-800 hover:bg-green-100">Done</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 capitalize text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading activities...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Activity Management</h1>
          <p className="text-slate-600 mt-1">Create, manage, and track all support team activities</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              New Activity
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Activity</DialogTitle>
              <DialogDescription>Add a new activity for the support team to track and manage.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Activity Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Daily SMS count in comparison to SMS count from logs"
                  value={newActivity.title}
                  onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the activity..."
                  value={newActivity.description}
                  onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
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
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createActivity} disabled={!newActivity.title.trim()}>
                  {isCreateActivity ? 'Loading...' : 'Create Activity'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">{error}</div>}

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Activities</CardTitle>
          <CardDescription>Manage and track the status of all support team activities</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No activities found. Create your first activity to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Activity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-900">{activity.title}</div>
                        <div className="text-sm text-slate-500 truncate max-w-xs">{activity.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(activity.status)}
                        {getStatusBadge(activity.status)}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{activity.profiles?.full_name || "Unknown"}</TableCell>
                    <TableCell className="text-slate-600">
                      {format(new Date(activity.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {format(new Date(activity.updated_at), "MMM dd, yyyy HH:mm")}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleViewActivity(activity)}>
                        <Edit className="h-4 w-4 mr-1" />
                        Update
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Update Activity Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Activity Status</DialogTitle>
            <DialogDescription>Update the status and add remarks for: {selectedActivity?.title}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Activity Details */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-medium text-slate-900 mb-2">Activity Details</h4>
              <p className="text-sm text-slate-600">{selectedActivity?.description}</p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                <span>
                  Created: {selectedActivity && format(new Date(selectedActivity.created_at), "MMM dd, yyyy HH:mm")}
                </span>
                <span>By: {selectedActivity?.profiles?.full_name}</span>
              </div>
            </div>

            {/* Update Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={updateForm.status}
                  onValueChange={(value) => setUpdateForm({ ...updateForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  placeholder="Add your remarks about this activity update..."
                  value={updateForm.remarks}
                  onChange={(e) => setUpdateForm({ ...updateForm, remarks: e.target.value })}
                />
              </div>
            </div>

            {/* Activity History */}
            {activityUpdates.length > 0 && (
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Update History</h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {activityUpdates.map((update) => (
                    <div key={update.id} className="border-l-2 border-slate-200 pl-4 pb-3">
                      <div className="flex items-center space-x-2 mb-1">
                        {getStatusIcon(update.status)}
                        {getStatusBadge(update.status)}
                        <span className="text-sm text-slate-600">by {update.profiles?.full_name}</span>
                        <span className="text-xs text-slate-500">
                          {format(new Date(update.updated_at), "MMM dd, yyyy HH:mm")}
                        </span>
                      </div>
                      {update.remarks && <p className="text-sm text-slate-700 mt-1">{update.remarks}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateActivity} disabled={!updateForm.status}>
                Update Activity
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
