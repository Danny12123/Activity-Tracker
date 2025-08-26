"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BarChart3, Download, Filter, CheckCircle, Clock } from "lucide-react"
import { format, startOfDay, endOfDay } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ReportData {
  activity: {
    id: string
    title: string
    category: string
  }
  updates: {
    id: string
    status: string
    remarks: string
    updated_at: string
    profile: {
      full_name: string
    }
  }[]
}

export function ReportsView() {
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")

  const supabase = createClient()

  useEffect(() => {
    generateReport()
  }, [])

  const generateReport = async () => {
    setLoading(true)
    try {
      const startDateTime = startOfDay(new Date(startDate))
      const endDateTime = endOfDay(new Date(endDate))

      let query = supabase
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
        .gte("updated_at", startDateTime.toISOString())
        .lte("updated_at", endDateTime.toISOString())
        .order("updated_at", { ascending: false })

      if (selectedCategory !== "all") {
        query = query.eq("activities.category", selectedCategory)
      }

      if (selectedStatus !== "all") {
        query = query.eq("status", selectedStatus)
      }

      const { data, error } = await query

      if (error) throw error

      // Group updates by activity
      const groupedData: { [key: string]: ReportData } = {}

      data?.forEach((update: any) => {
        const activityId = update.activities.id
        if (!groupedData[activityId]) {
          groupedData[activityId] = {
            activity: update.activities,
            updates: [],
          }
        }
        groupedData[activityId].updates.push({
          id: update.id,
          status: update.status,
          remarks: update.remarks,
          updated_at: update.updated_at,
          profile: update.profiles,
        })
      })

      setReportData(Object.values(groupedData))
    } catch (error) {
      console.error("Error generating report:", error)
    } finally {
      setLoading(false)
    }
  }
// Export report as CSV
  const exportReport = () => {
    const csvContent = generateCSV()
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `activity_report_${startDate}_to_${endDate}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const generateCSV = () => {
    const headers = ["Activity Title", "Category", "Status", "Updated By", "Update Time", "Remarks"]
    const rows = [headers.join(",")]

    reportData.forEach((item) => {
      item.updates.forEach((update) => {
        const row = [
          `"${item.activity.title}"`,
          item.activity.category,
          update.status,
          update.profile.full_name,
          format(new Date(update.updated_at), "yyyy-MM-dd HH:mm:ss"),
          `"${update.remarks || ""}"`,
        ]
        rows.push(row.join(","))
      })
    })

    return rows.join("\n")
  }

  const getTotalUpdates = () => {
    return reportData.reduce((total, item) => total + item.updates.length, 0)
  }

  const getCompletedActivities = () => {
    return reportData.filter((item) => {
      const latestUpdate = item.updates[0] 
      return latestUpdate?.status === "done"
    }).length
  }

  const getPendingActivities = () => {
    return reportData.filter((item) => {
      const latestUpdate = item.updates[0]
      return latestUpdate?.status === "pending" || !latestUpdate
    }).length
  }

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Activity Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                  value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value)}
                defaultValue="General"
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Monitoring">Monitoring</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="Performance">Performance</SelectItem>
                    <SelectItem value="Troubleshooting">Troubleshooting</SelectItem>
                  </SelectContent>
                </Select>
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              
              <Select
                  value={selectedStatus}
                onValueChange={(value) => setSelectedStatus(value)}
                defaultValue="all"
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={generateReport} disabled={loading}>
              <Filter className="w-4 h-4 mr-2" />
              {loading ? "Generating..." : "Generate Report"}
            </Button>
            <Button variant="outline" onClick={exportReport} disabled={reportData.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Summary */}
      {reportData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{reportData.length}</div>
              <div className="text-sm text-slate-600">Activities</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{getCompletedActivities()}</div>
              <div className="text-sm text-slate-600">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{getPendingActivities()}</div>
              <div className="text-sm text-slate-600">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-slate-600">{getTotalUpdates()}</div>
              <div className="text-sm text-slate-600">Total Updates</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Data */}
      <Card>
        <CardHeader>
          <CardTitle>
            Report Results ({format(new Date(startDate), "MMM d")} - {format(new Date(endDate), "MMM d, yyyy")})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Generating report...</div>
          ) : reportData.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No data found for the selected criteria.</div>
          ) : (
            <div className="space-y-6">
              {reportData.map((item) => {
                const latestUpdate = item.updates[0]

                return (
                  <div key={item.activity.id} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-800 mb-2">{item.activity.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {item.activity.category}
                          </Badge>
                          <Badge
                            variant={latestUpdate?.status === "done" ? "default" : "secondary"}
                            className={`text-xs ${latestUpdate?.status === "done" ? "bg-green-100 text-green-800" : ""}`}
                          >
                            {latestUpdate?.status === "done" ? (
                              <CheckCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <Clock className="w-3 h-3 mr-1" />
                            )}
                            Latest: {latestUpdate?.status || "No updates"}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {item.updates.length} update{item.updates.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-slate-700">Update History</h4>
                      {item.updates.map((update) => (
                        <div key={update.id} className="flex items-start space-x-3 p-2 bg-slate-50 rounded text-sm">
                          <div className="flex-shrink-0 mt-1">
                            {update.status === "done" ? (
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            ) : (
                              <Clock className="w-3 h-3 text-orange-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant={update.status === "done" ? "default" : "secondary"}
                                className={`text-xs ${update.status === "done" ? "bg-green-100 text-green-800" : ""}`}
                              >
                                {update.status}
                              </Badge>
                              <span className="text-xs text-slate-600">{update.profile.full_name}</span>
                              <span className="text-xs text-slate-500">
                                {format(new Date(update.updated_at), "MMM d, h:mm a")}
                              </span>
                            </div>
                            {update.remarks && <p className="text-xs text-slate-600 mt-1">{update.remarks}</p>}
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
