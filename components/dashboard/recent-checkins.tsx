"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserCheck, Clock, AlertTriangle, Zap } from "lucide-react"
import { Loading } from "@/components/ui/loading"
import { MemberDemographicsDialog } from "@/components/members/member-demographics-dialog"
import { useRealtimeCheckins } from "@/hooks/use-realtime-checkins"
import { useState } from "react"
import type { Member } from "@/lib/types"

export function RecentCheckIns() {
  const { recentCheckins, todayCount, isConnected } = useRealtimeCheckins()
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [showDemographics, setShowDemographics] = useState(false)

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member)
    setShowDemographics(true)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Recent Check-ins
              {isConnected && (
                <Zap className="h-4 w-4 text-green-500" title="Real-time updates active" />
              )}
            </div>
            <Badge variant="secondary" className="text-xs">
              {todayCount} today
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentCheckins && recentCheckins.length > 0 ? (
              recentCheckins.map((checkin: any) => (
                <div key={checkin.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <UserCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{checkin.member?.name || 'Unknown Member'}</p>
                        <Badge variant="outline" className="text-xs">
                          ID: {checkin.member?.member_id}
                        </Badge>
                        {checkin.member?.months_due && checkin.member.months_due > 0 && (
                          <Badge variant="destructive" className="text-xs flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {checkin.member.months_due} Month{checkin.member.months_due > 1 ? 's' : ''} Due
                          </Badge>
                        )}
                        <Badge 
                          variant={checkin.entry_method === 'biometric' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {checkin.entry_method === 'biometric' ? '👆 Biometric' : '📱 Manual'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {checkin.device_name || 'Main Door'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatTime(checkin.check_in_time)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(checkin.check_in_time)}
                      </p>
                    </div>
                    {checkin.member && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleMemberClick(checkin.member)}
                      >
                        View
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent check-ins</p>
                <p className="text-xs mt-1">Check-ins will appear here in real-time</p>
              </div>
            )}
          </div>
          
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-green-500" />
                <span>Live updates {isConnected ? 'active' : 'disconnected'}</span>
              </div>
              <span>Real-time attendance tracking</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {showDemographics && (
        <MemberDemographicsDialog
          member={selectedMember}
          onClose={() => {
            setShowDemographics(false)
            setSelectedMember(null)
          }}
        />
      )}
    </>
  )
}