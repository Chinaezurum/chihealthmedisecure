import React, { useState, useEffect, useRef } from 'react';
import { MicIcon, MicOffIcon, VideoIcon, VideoOffIcon } from '../../components/icons/index.tsx';
import * as geminiService from '../../services/geminiService.ts';
import { useToasts } from '../../hooks/useToasts.ts';

interface TelemedicineViewProps {
  onEndCall: (aiNote?: string) => void;
  patientName?: string;
  doctorName?: string;
}

const mockTranscript = `Doctor: Good morning, how are you feeling today?
Patient: I've been having this persistent cough and a bit of a sore throat for the past three days.
Doctor: Any fever or body aches?
Patient: A slight fever yesterday, but it's gone down. My body feels a little tired.
Doctor: Okay, let's take a look. Please open your mouth and say 'ah'. It looks a bit red. I'd recommend you get some rest, stay hydrated, and you can take some lozenges for the throat. If it doesn't improve in a couple of days or if the fever returns, please book another appointment.
Patient: Thank you, doctor.`;


export const TelemedicineView: React.FC<TelemedicineViewProps> = ({ onEndCall, patientName = "Amina Bello", doctorName = "Dr. Adebayo" }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const { addToast } = useToasts();

  // Call timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Get user media
  useEffect(() => {
    const startMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // In a real app, this stream would be sent to the peer
        if (remoteVideoRef.current) {
          // For simulation, we can use a placeholder or the same stream
          const remoteStream = new MediaStream(stream.getVideoTracks()); // Simulate video only from remote
          remoteVideoRef.current.srcObject = remoteStream;
        }
      } catch (err) {
        console.error("Error accessing media devices.", err);
        addToast("Could not access camera and microphone. Please check permissions.", 'error');
      }
    };

    startMedia();

    return () => {
      // Clean up stream on unmount
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [addToast]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(prev => !prev);
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(prev => !prev);
    }
  };

  const handleEndCall = async () => {
    // For HCW, generate AI note from transcript
    if (doctorName) { // Simple check if this is the doctor's view
        try {
            const note = await geminiService.generateEHRSummary(mockTranscript);
            onEndCall(note);
        } catch (error) {
            console.error("Failed to generate note", error);
            onEndCall("AI note generation failed. Please write one manually based on the call.");
        }
    } else {
        onEndCall();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="telemedicine-container">
        <div className="telemedicine-video-area">
            <div className="main-video-wrapper">
                <video ref={remoteVideoRef} autoPlay playsInline muted className="main-video" />
                <div className="participant-name-tag main-participant">{doctorName}</div>
            </div>
            <div className="pip-video-wrapper">
                <video ref={localVideoRef} autoPlay playsInline muted className="pip-video" />
                <div className="participant-name-tag pip-participant">{patientName} (You)</div>
            </div>
            <div className="call-timer">{formatDuration(callDuration)}</div>
        </div>
        <div className="telemedicine-controls">
            <button onClick={toggleMute} className={`control-button ${isMuted ? 'toggled-off' : ''}`}>
                {isMuted ? <MicOffIcon /> : <MicIcon />}
            </button>
            <button onClick={toggleCamera} className={`control-button ${isCameraOff ? 'toggled-off' : ''}`}>
                {isCameraOff ? <VideoOffIcon /> : <VideoIcon />}
            </button>
            <button onClick={handleEndCall} className="control-button end-call">
                End Call
            </button>
        </div>
    </div>
  );
};