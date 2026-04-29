import { useState, useRef, useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useFamilyMembers } from "@/hooks/use-family";
import { useMessages, useSendMessage, useWebRTC } from "@/hooks/use-comms";
import { Button, Card, PageTransition, Header } from "@/components/ui/modern";
import { Send, Video, PhoneOff, Phone } from "lucide-react";

export default function Comms() {
  const { user } = useAuthContext();
  const { data: members } = useFamilyMembers();
  const [selectedContact, setSelectedContact] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");

  const { data: messages } = useMessages(selectedContact || 0);
  const sendMutation = useSendMessage();

  const { wsConnected, incomingCall, stream, remoteStream, callUser, answerCall, endCall } = useWebRTC(user?.id);
  const myVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (myVideo.current && stream) myVideo.current.srcObject = stream;
  }, [stream]);

  useEffect(() => {
    if (remoteVideo.current && remoteStream) remoteVideo.current.srcObject = remoteStream;
  }, [remoteStream]);

  if (!user) return null;

  const contacts = user.role === "parent" ? members : members?.filter((m) => m.id === user.parentId || m.role === "parent");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact || !messageText.trim()) return;
    sendMutation.mutate(
      { receiverId: selectedContact, content: messageText },
      { onSuccess: () => setMessageText("") }
    );
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <Header title="Messages 💬" />
          <div className="text-sm">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${wsConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
              <span className={`w-2 h-2 rounded-full ${wsConnected ? "bg-green-500" : "bg-red-500"}`} />
              {wsConnected ? "Online" : "Offline"}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-220px)]">
          {/* Contacts */}
          <Card className="overflow-y-auto p-2">
            <p className="px-3 py-2 text-xs font-bold text-gray-500 uppercase">Contacts</p>
            <div className="space-y-1">
              {contacts?.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setSelectedContact(contact.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                    selectedContact === contact.id ? "bg-blue-50" : "hover:bg-gray-50"
                  }`}
                  data-testid={`contact-${contact.id}`}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: contact.color || "#3B82F6" }}
                  >
                    {contact.username[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{contact.username}</p>
                    <p className="text-xs text-gray-500">{contact.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Chat */}
          <Card className="flex flex-col p-0 overflow-hidden">
            {!selectedContact ? (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Choose a contact to start chatting
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                  <p className="font-bold text-gray-900">
                    {contacts?.find((c) => c.id === selectedContact)?.username}
                  </p>
                  {!remoteStream ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => callUser(selectedContact)}
                      data-testid="button-call"
                    >
                      <Video size={16} /> Video Call
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={endCall}
                      data-testid="button-end-call"
                    >
                      <PhoneOff size={16} /> End Call
                    </Button>
                  )}
                </div>

                {(stream || remoteStream) && (
                  <div className="h-64 bg-black relative flex items-center justify-center">
                    {remoteStream ? (
                      <video playsInline ref={remoteVideo} autoPlay className="h-full w-full object-cover" />
                    ) : (
                      <p className="text-white">Waiting for connection...</p>
                    )}
                    <video
                      playsInline
                      ref={myVideo}
                      autoPlay
                      muted
                      className="absolute bottom-4 right-4 w-32 h-24 rounded-xl border-2 border-white object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {messages?.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === user.id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                          msg.senderId === user.id
                            ? "bg-blue-500 text-white rounded-br-md"
                            : "bg-gray-100 text-gray-900 rounded-bl-md"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex gap-2">
                  <input
                    className="flex-1 px-4 py-2.5 rounded-full bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    data-testid="input-message"
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={sendMutation.isPending || !messageText.trim()}
                    data-testid="button-send"
                  >
                    <Send size={18} />
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>

        {incomingCall && !remoteStream && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="max-w-md w-full text-center">
              <div className="text-5xl mb-4 animate-pulse">📞</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Incoming Call</h3>
              <p className="text-gray-600 mb-6">
                {members?.find((m) => m.id === incomingCall.senderId)?.username} is calling
              </p>
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={endCall}
                  data-testid="button-reject-call"
                >
                  <PhoneOff size={18} /> Decline
                </Button>
                <Button
                  variant="primary"
                  className="flex-1 !bg-green-500 hover:!bg-green-600"
                  onClick={answerCall}
                  data-testid="button-accept-call"
                >
                  <Phone size={18} /> Accept
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
