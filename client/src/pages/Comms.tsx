import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFamilyMembers } from "@/hooks/use-family";
import { useMessages, useSendMessage, useWebRTC } from "@/hooks/use-comms";
import { HardwareButton, OLEDDisplay, TapeLabel, PageTransition } from "@/components/ui/hardware";

export default function Comms() {
  const { data: user } = useAuth();
  const { data: members } = useFamilyMembers();
  const [selectedContact, setSelectedContact] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  
  const { data: messages } = useMessages(selectedContact || 0);
  const sendMutation = useSendMessage();
  
  const { wsConnected, incomingCall, stream, remoteStream, callUser, answerCall, endCall } = useWebRTC(user?.id);
  const myVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (myVideo.current && stream) {
      myVideo.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (remoteVideo.current && remoteStream) {
      remoteVideo.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!user) return null;

  const contacts = user.role === 'parent' ? members : members?.filter(m => m.id === user.parentId || m.role === 'parent');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !messageText.trim()) return;
    sendMutation.mutate({ receiverId: selectedContact, content: messageText }, {
      onSuccess: () => setMessageText("")
    });
  };

  return (
    <PageTransition>
      <div className="p-4 md:p-8 max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col">
        <TapeLabel className="mb-4" angle={1}>COMMS_UPLINK</TapeLabel>
        
        <div className="flex flex-col md:flex-row gap-6 flex-1 min-h-0">
          
          {/* Contacts Sidebar */}
          <div className="w-full md:w-64 flex flex-col gap-2 overflow-y-auto">
            <div className="text-xs font-display text-neutral-500 mb-2">TARGET_VECTORS</div>
            {contacts?.map(contact => (
              <HardwareButton
                key={contact.id}
                onClick={() => setSelectedContact(contact.id)}
                color={selectedContact === contact.id ? (contact.color || "#FFF") : "#222"}
                textColor={selectedContact === contact.id ? "#000" : "#FFF"}
                className="justify-start py-3 shadow-[4px_4px_0_#000]"
              >
                {contact.username}
              </HardwareButton>
            ))}

            <OLEDDisplay className="mt-8 min-h-[60px]">
              <div className="text-xs">UPLINK_STATUS:</div>
              <div className={wsConnected ? "text-green-500" : "text-red-500"}>
                {wsConnected ? "ESTABLISHED" : "DISCONNECTED"}
              </div>
            </OLEDDisplay>
          </div>

          {/* Main Area */}
          <div className="flex-1 flex flex-col gap-4 bg-[#111] border-4 border-[#222] p-4 relative">
            
            {incomingCall && !remoteStream && (
              <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-8 backdrop-blur-sm">
                <OLEDDisplay className="text-center mb-8 border-yellow-500 text-yellow-500">
                  <div className="text-3xl animate-pulse">INCOMING_TRANSMISSION</div>
                  <div className="text-xl mt-2">FROM_TARGET_{incomingCall.senderId}</div>
                </OLEDDisplay>
                <div className="flex gap-4">
                  <HardwareButton color="#00D34D" onClick={answerCall} className="px-12 py-6 text-2xl">ACCEPT</HardwareButton>
                  <HardwareButton color="#FF0000" onClick={endCall} className="px-12 py-6 text-2xl text-white">REJECT</HardwareButton>
                </div>
              </div>
            )}

            {!selectedContact ? (
              <div className="flex-1 flex items-center justify-center">
                <OLEDDisplay className="w-64 text-center text-neutral-600 border-neutral-800">NO_TARGET_SELECTED</OLEDDisplay>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center border-b-2 border-[#333] pb-4">
                  <div className="font-display text-white uppercase text-xl">TARGET: {contacts?.find(c=>c.id===selectedContact)?.username}</div>
                  {!remoteStream && (
                    <HardwareButton color="#FF4F00" textColor="#FFF" className="py-2 px-6" onClick={() => callUser(selectedContact)}>
                      INITIATE_VIDEO
                    </HardwareButton>
                  )}
                  {remoteStream && (
                    <HardwareButton color="#FF0000" textColor="#FFF" className="py-2 px-6" onClick={endCall} animate={{scale:[1,1.05,1]}} transition={{repeat:Infinity, duration:2}}>
                      TERMINATE_LINK
                    </HardwareButton>
                  )}
                </div>

                {/* Video Feed */}
                {(stream || remoteStream) && (
                  <div className="h-64 bg-black border-2 border-[#333] relative flex justify-center items-center overflow-hidden">
                    {remoteStream ? (
                      <video playsInline ref={remoteVideo} autoPlay className="h-full w-full object-cover" />
                    ) : (
                      <OLEDDisplay className="border-none w-full h-full flex items-center justify-center text-center">
                        AWAITING_CONNECTION...
                      </OLEDDisplay>
                    )}
                    <video playsInline ref={myVideo} autoPlay muted className="absolute bottom-4 right-4 w-32 h-24 border-2 border-[#555] bg-neutral-900 object-cover" />
                  </div>
                )}

                {/* Text Feed */}
                <div className="flex-1 overflow-y-auto bg-[#0a0a0a] border border-[#222] p-4 font-mono space-y-2 flex flex-col">
                  {messages?.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-2 ${msg.senderId === user.id ? 'bg-[#222] text-white border-r-4 border-primary' : 'bg-[#1a1a1a] text-[#00ff41] border-l-4 border-accent'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSend} className="flex gap-2 pt-2">
                  <input 
                    className="flex-1 bg-[#222] border-2 border-[#000] p-4 text-white font-mono focus:outline-none focus:border-primary shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    placeholder=">_ TYPE_MESSAGE"
                  />
                  <HardwareButton type="submit" className="px-8" color="#FFF" textColor="#000" disabled={sendMutation.isPending || !messageText.trim()}>
                    TX
                  </HardwareButton>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
