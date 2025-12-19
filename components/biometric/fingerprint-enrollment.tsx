"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Fingerprint, Loader2, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

interface FingerprintEnrollmentProps {
  memberId: string
  memberName: string
  isEnrolled?: boolean
  onEnrollmentComplete?: () => void
}

export function FingerprintEnrollment({ 
  memberId, 
  memberName, 
  isEnrolled = false,
  onEnrollmentComplete 
}: FingerprintEnrollmentProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [enrollmentStatus, setEnrollmentStatus] = useState<'idle' | 'enrolling' | 'success' | 'error'>('idle')

  const handleEnrollment = async () => {
    setIsEnrolling(true)
    setEnrollmentStatus('enrolling')

    try {
      const response = await fetch('/api/biometric/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, memberName })
      })

      const result = await response.json()

      if (result.success) {
        setEnrollmentStatus('success')
        toast.success('Fingerprint enrollment started. Please place finger on scanner.')
        onEnrollmentComplete?.()
        
        // Auto close dialog after 3 seconds
        setTimeout(() => {
          setIsOpen(false)
          setEnrollmentStatus('idle')
        }, 3000)
      } else {
        setEnrollmentStatus('error')
        toast.error(result.error || 'Enrollment failed')
      }
    } catch (error) {
      setEnrollmentStatus('error')
      toast.error('Failed to start enrollment')
    } finally {
      setIsEnrolling(false)
    }
  }

  const handleRemoveEnrollment = async () => {
    setIsEnrolling(true)
    
    try {
      const response = await fetch('/api/biometric/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Fingerprint removed successfully')
        onEnrollmentComplete?.()
        setIsOpen(false)
      } else {
        toast.error(result.error || 'Failed to remove fingerprint')
      }
    } catch (error) {
      toast.error('Failed to remove fingerprint')
    } finally {
      setIsEnrolling(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Fingerprint className="h-4 w-4 mr-2" />
          {isEnrolled ? 'Manage' : 'Enroll'} Fingerprint
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Fingerprint Enrollment
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-medium">{memberName}</h3>
            <p className="text-sm text-muted-foreground">Member ID: {memberId}</p>
            
            <div className="mt-2">
              {isEnrolled ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Enrolled
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Enrolled
                </Badge>
              )}
            </div>
          </div>

          {enrollmentStatus === 'enrolling' && (
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-500" />
              <p className="text-sm font-medium">Starting enrollment...</p>
              <p className="text-xs text-muted-foreground">Please wait while we prepare the scanner</p>
            </div>
          )}

          {enrollmentStatus === 'success' && (
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm font-medium">Enrollment Started!</p>
              <p className="text-xs text-muted-foreground">
                Please place your finger on the scanner and follow the device instructions
              </p>
            </div>
          )}

          {enrollmentStatus === 'error' && (
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <XCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="text-sm font-medium">Enrollment Failed</p>
              <p className="text-xs text-muted-foreground">
                Please check device connection and try again
              </p>
            </div>
          )}

          <div className="flex gap-2">
            {!isEnrolled ? (
              <Button 
                onClick={handleEnrollment} 
                disabled={isEnrolling}
                className="flex-1"
              >
                {isEnrolling ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Fingerprint className="h-4 w-4 mr-2" />
                )}
                Start Enrollment
              </Button>
            ) : (
              <>
                <Button 
                  onClick={handleEnrollment} 
                  disabled={isEnrolling}
                  variant="outline"
                  className="flex-1"
                >
                  Re-enroll
                </Button>
                <Button 
                  onClick={handleRemoveEnrollment} 
                  disabled={isEnrolling}
                  variant="destructive"
                  className="flex-1"
                >
                  Remove
                </Button>
              </>
            )}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            <p>• Ensure the scanner device is connected and powered on</p>
            <p>• Clean your finger before scanning for best results</p>
            <p>• Follow the device prompts during enrollment</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}