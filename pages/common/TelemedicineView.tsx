import React, { useState, useEffect, useRef } from 'react';
import { MicIcon, MicOffIcon, VideoIcon, VideoOffIcon, PhoneIcon, MessageSquareIcon, UserIcon, SearchIcon } from '../../components/icons/index.tsx';
import * as geminiService from '../../services/geminiService.ts';
import { useToasts } from '../../hooks/useToasts.ts';
import { User } from '../../types.ts';
import { Button } from '../../components/common/Button.tsx';

type CallMode = 'audio' | 'video' | 'chat';

interface TelemedicineViewProps {
  onEndCall: (aiNote?: string) => void;
  currentUser: User;
  availableContacts: User[]; // Doctors for patients, or patients for doctors
  onStartCall?: (contactId: string, mode: CallMode) => void;
}

const mockTranscript = `Doctor: Good morning, how are you feeling today?
Patient: I've been having this persistent cough and a bit of a sore throat for the past three days.
Doctor: Any fever or body aches?
Patient: A slight fever yesterday, but it's gone down. My body feels a little tired.
Doctor: Okay, let's take a look. Please open your mouth and say 'ah'. It looks a bit red. I'd recommend you get some rest, stay hydrated, and you can take some lozenges for the throat. If it doesn't improve in a couple of days or if the fever returns, please book another appointment.
Patient: Thank you, doctor.`;


export const TelemedicineView: React.FC<TelemedicineViewProps> = ({ onEndCall, currentUser, availableContacts = [], onStartCall }) => {
  const [callMode, setCallMode] = useState<CallMode>('video');
  const [isInCall, setIsInCall] = useState(false);
  const [selectedContact, setSelectedContact] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const { addToast } = useToasts();

  // Call timer
  useEffect(() => {
    if (!isInCall) return;
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isInCall]);

  // Get user media
  useEffect(() => {
    if (!isInCall || callMode === 'chat') return;
    
    const startMedia = async () => {
      try {
        const constraints = callMode === 'video' 
          ? { video: true, audio: true }
          : { video: false, audio: true };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;
        if (localVideoRef.current && callMode === 'video') {
          localVideoRef.current.srcObject = stream;
        }
        // In a real app, this stream would be sent to the peer
        if (remoteVideoRef.current && callMode === 'video') {
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
  }, [addToast, isInCall, callMode]);

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

  const handleStartCall = (contact: User, mode: CallMode) => {
    setSelectedContact(contact);
    setCallMode(mode);
    setIsInCall(true);
    setCallDuration(0);
    if (onStartCall) {
      onStartCall(contact.id, mode);
    }
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    const newMessage = {
      sender: currentUser.name,
      text: chatInput,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMessage]);
    setChatInput('');
  };

  const handleEndCall = async () => {
    // For HCW, generate AI note from transcript
    if (currentUser.role === 'hcw') {
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
    setIsInCall(false);
    setSelectedContact(null);
    setCallDuration(0);
    setChatMessages([]);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const filteredContacts = availableContacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Contact Selection Screen
  if (!isInCall) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-text-primary">Telemedicine</h2>
          <p className="text-text-secondary mt-1">
            {currentUser.role === 'patient' 
              ? 'Connect with your healthcare provider' 
              : 'Start a consultation with your patient'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="content-card p-4">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary pointer-events-none z-10" />
            <input
              type="text"
              placeholder={currentUser.role === 'patient' ? 'Search for a doctor...' : 'Search for a patient...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border-primary rounded-lg bg-background-secondary text-text-primary focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="content-card p-6">
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            {currentUser.role === 'patient' ? 'Available Doctors' : 'Your Patients'}
          </h3>
          
          {filteredContacts.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <UserIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No {currentUser.role === 'patient' ? 'doctors' : 'patients'} available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredContacts.map(contact => (
                <div key={contact.id} className="flex items-center justify-between p-4 border border-border-primary rounded-lg hover:border-primary transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-background-secondary flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-text-secondary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-text-primary">{contact.name}</h4>
                      <p className="text-sm text-text-secondary">{contact.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartCall(contact, 'audio')}
                      className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                      title="Voice Call"
                    >
                      <PhoneIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleStartCall(contact, 'video')}
                      className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                      title="Video Call"
                    >
                      <VideoIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleStartCall(contact, 'chat')}
                      className="p-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white transition-colors"
                      title="Text Chat"
                    >
                      <MessageSquareIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active Call Screen
  if (callMode === 'chat') {
    return (
      <div className="flex flex-col h-full">
        <div className="content-card p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-background-secondary flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">{selectedContact?.name}</h3>
                <p className="text-sm text-green-500">● Online</p>
              </div>
            </div>
            <button onClick={handleEndCall} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">
              End Chat
            </button>
          </div>
        </div>

        <div className="flex-1 content-card p-4 mb-4 overflow-y-auto">
          {chatMessages.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <MessageSquareIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === currentUser.name ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.sender === currentUser.name 
                      ? 'bg-primary text-white' 
                      : 'bg-background-secondary text-text-primary'
                  }`}>
                    <p className="text-sm">{msg.text}</p>
                    <p className="text-xs opacity-70 mt-1">{msg.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="content-card p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-border-primary rounded-lg bg-background-secondary text-text-primary focus:outline-none focus:border-primary"
            />
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
        </div>
      </div>
    );
  }

  // Audio/Video Call Screen
  return (
    <div className="telemedicine-container">
        <div className="telemedicine-video-area">
            {callMode === 'video' && (
              <>
                <div className="main-video-wrapper">
                    <video ref={remoteVideoRef} autoPlay playsInline muted className="main-video" />
                    <div className="participant-name-tag main-participant">{selectedContact?.name}</div>
                </div>
                <div className="pip-video-wrapper">
                    <video ref={localVideoRef} autoPlay playsInline muted className="pip-video" />
                    <div className="participant-name-tag pip-participant">{currentUser.name} (You)</div>
                </div>
              </>
            )}
            {callMode === 'audio' && (
              <div className="audio-call-screen">
                <div className="audio-call-avatar">
                  <UserIcon className="w-24 h-24 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mt-4">{selectedContact?.name}</h2>
                <p className="text-white opacity-80 mt-2">Audio Call in Progress</p>
              </div>
            )}
            <div className="call-timer">{formatDuration(callDuration)}</div>
        </div>
        <div className="telemedicine-controls">
            <button onClick={toggleMute} className={`control-button ${isMuted ? 'toggled-off' : ''}`}>
                {isMuted ? <MicOffIcon /> : <MicIcon />}
            </button>
            {callMode === 'video' && (
              <button onClick={toggleCamera} className={`control-button ${isCameraOff ? 'toggled-off' : ''}`}>
                  {isCameraOff ? <VideoOffIcon /> : <VideoIcon />}
              </button>
            )}
            <button onClick={handleEndCall} className="control-button end-call">
                End Call
            </button>
        </div>
    </div>
  );
};