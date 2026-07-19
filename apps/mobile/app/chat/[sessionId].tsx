import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { io, Socket } from "socket.io-client";
import { Ionicons } from "@expo/vector-icons";
import RazorpayCheckout from "react-native-razorpay";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { api } from "@/src/api";
import { Skeleton, SkeletonLine } from "@/src/Skeleton";
import { useSession } from "@/src/session";
import { colors, fonts } from "@/src/ui";

type Message = { id: string; senderId: string; content: string; createdAt: string };
type ParsedMessage = { type: "text"; text: string } | { type: "image"; uri: string };
type ChatSession = {
  id: string;
  status: string;
  startedAt: string;
  totalCost?: number;
  messages: Message[];
  astrologer: { id: string; profileImage?: string | null; user: { name: string }; ratePerMin: number };
  user: { walletBalance: number };
};
type KundliProfile = { fullName: string; dateOfBirth: string; timeOfBirth: string | null; placeOfBirth: string };

export default function ChatScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const { user, refresh } = useSession();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [chat, setChat] = useState<ChatSession | null>(null);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [ended, setEnded] = useState(false);
  const [connected, setConnected] = useState(false);
  const [astrologerJoined, setAstrologerJoined] = useState(false);
  const [billingStarted, setBillingStarted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [balance, setBalance] = useState(0);
  const [introSecondsLeft, setIntroSecondsLeft] = useState(0);
  const [isFreeMinute, setIsFreeMinute] = useState(false);
  const [waitLeft, setWaitLeft] = useState(600);
  const [waitTimedOut, setWaitTimedOut] = useState(false);
  const [endReason, setEndReason] = useState<string | null>(null);
  const [kundli, setKundli] = useState<KundliProfile | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [recharging, setRecharging] = useState(false);
  const socket = useRef<Socket | null>(null);
  const list = useRef<FlatList<Message>>(null);
  const freeMinutesLeftRef = useRef(0);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [session, token, profile] = await Promise.all([
          api<ChatSession>(`/api/chat/session/${sessionId}`),
          api<{ token: string }>("/api/chat/socket-token"),
          api<{ walletBalance: number; freeMinutesLeft: number }>("/api/mobile/me"),
        ]);
        api<KundliProfile | null>("/api/user/kundli").then(setKundli).catch(() => undefined);
        if (!active) return;

        const allMessages = session.messages || [];
        const startedAtMs = new Date(session.startedAt).getTime();
        const currentMessages = allMessages.filter((message) => new Date(message.createdAt).getTime() >= startedAtMs);
        setChat({ ...session, messages: allMessages });
        setEnded(session.status === "ENDED");
        setWaitLeft(Math.max(0, 600 - Math.floor((Date.now() - startedAtMs) / 1000)));
        setBalance(profile.walletBalance || session.user.walletBalance || 0);
        const nextFreeMinutes = profile.freeMinutesLeft || 0;
        freeMinutesLeftRef.current = nextFreeMinutes;
        setIntroSecondsLeft(nextFreeMinutes * 60);
        setIsFreeMinute(nextFreeMinutes > 0);
        if (currentMessages.length > 0) setAstrologerJoined(true);
        if ((session.totalCost || 0) > 0 && session.status !== "ENDED") setBillingStarted(true);

        const client = io(process.env.EXPO_PUBLIC_SOCKET_URL || "http://10.0.2.2:3001", {
          auth: { token: token.token },
          transports: ["websocket"],
        });
        socket.current = client;
        client.on("connect", () => {
          setConnected(true);
          client.emit("join_session", { sessionId });
        });
        client.on("disconnect", () => setConnected(false));
        client.on("astrologer_joined", () => setAstrologerJoined(true));
        client.on("billing_started", () => {
          setAstrologerJoined(true);
          setBillingStarted(true);
          setIntroSecondsLeft((current) => (current > 0 ? current : freeMinutesLeftRef.current * 60));
        });
        client.on("receive_message", (message: Message) => {
          setAstrologerJoined(true);
          setChat((current) => {
            if (!current || current.messages.some((item) => item.id === message.id)) return current;
            return { ...current, messages: [...current.messages, message] };
          });
        });
        client.on("user_typing", ({ isTyping }: { isTyping: boolean }) => setTyping(isTyping));
        client.on("balance_update", ({ balance: nextBalance, freeMinutesLeft: nextFree, isFreeMinute: nextIsFree }: { balance: number; freeMinutesLeft?: number; isFreeMinute?: boolean }) => {
          setBalance(nextBalance);
          if (nextFree !== undefined) {
            freeMinutesLeftRef.current = nextFree;
            setIntroSecondsLeft(nextIsFree ? (nextFree + 1) * 60 : 0);
          }
          if (nextIsFree !== undefined) {
            setIsFreeMinute(nextIsFree);
            if (!nextIsFree) setIntroSecondsLeft(0);
          }
        });
        client.on("session_cancelled", () => {
          setEndReason("cancelled");
          setEnded(true);
          void refresh();
        });
        client.on("session_ended", ({ reason }: { reason?: string } = {}) => {
          setEndReason(reason || null);
          setEnded(true);
          setBillingStarted(false);
          void refresh();
        });
      } catch {
        router.back();
      }
    })();
    return () => {
      active = false;
      socket.current?.disconnect();
    };
  }, [sessionId, refresh]);

  useEffect(() => {
    if (ended || !billingStarted) return;
    const timer = setInterval(() => setDuration((current) => current + 1), 1000);
    return () => clearInterval(timer);
  }, [billingStarted, ended]);

  useEffect(() => {
    if (ended || !billingStarted || !isFreeMinute || introSecondsLeft <= 0) return;
    const timer = setInterval(() => {
      setIntroSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [billingStarted, ended, isFreeMinute, introSecondsLeft]);

  useEffect(() => {
    if (ended || astrologerJoined) return;
    const timer = setInterval(() => {
      setWaitLeft((current) => {
        if (current <= 1) {
          clearInterval(timer);
          setWaitTimedOut(true);
          void api("/api/chat/cancel", { method: "POST", body: JSON.stringify({ sessionId }) }).catch(() => undefined);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [astrologerJoined, ended, sessionId]);

  const cancelBeforeJoin = async () => {
    try {
      await api("/api/chat/cancel", { method: "POST", body: JSON.stringify({ sessionId }) });
    } catch {
      // If it already started, the server will reject cancellation. We still return to list.
    } finally {
      router.replace("/(tabs)/chats");
    }
  };

  const send = () => {
    if (!text.trim() || !astrologerJoined || ended) return;
    socket.current?.emit("send_message", { sessionId, content: text.trim() });
    socket.current?.emit("typing", { sessionId, isTyping: false });
    setText("");
  };

  const sendImage = async () => {
    if (!astrologerJoined || ended) return;
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Photo access needed", "Please allow photo access to share an image in chat.");
        return;
      }

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.45,
        base64: true,
        allowsMultipleSelection: false,
      });
      if (picked.canceled || !picked.assets?.[0]?.uri) return;

      const selected = picked.assets[0];
      if (!selected.base64) {
        Alert.alert("Could not attach image", "Please try a different photo.");
        return;
      }

      const mimeType = selected.mimeType || "image/jpeg";
      const payload = JSON.stringify({ type: "image", uri: `data:${mimeType};base64,${selected.base64}` });
      if (payload.length > 850_000) {
        Alert.alert("Image is too large", "Please choose a smaller image or screenshot.");
        return;
      }
      socket.current?.emit("send_message", { sessionId, content: payload });
    } catch (error: any) {
      Alert.alert("Could not share image", error?.message || "Please try again.");
    }
  };
  const end = () => socket.current?.emit("end_session", { sessionId });

  const rechargeInChat = async (amount = 50) => {
    if (recharging) return;
    try {
      setRecharging(true);
      const order = await api<any>("/api/user/wallet/create-order", {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      const payment: any = await RazorpayCheckout.open({
        key: order.keyId,
        amount: order.amount * 100,
        currency: order.currency,
        name: "AstroWalla",
        description: "Wallet top-up",
        order_id: order.orderId,
        theme: { color: colors.gold },
      });
      const verified = await api<{ balance: number }>("/api/user/wallet/verify", { method: "POST", body: JSON.stringify(payment) });
      setBalance(verified.balance);
      await refresh();
    } catch (error: any) {
      if (error?.code !== 0) Alert.alert("Top-up failed", error?.message || "Please try again.");
    } finally {
      setRecharging(false);
    }
  };

  const submitReview = async () => {
    if (!chat || rating < 1) return;
    try {
      setSubmittingReview(true);
      await api("/api/chat/review", {
        method: "POST",
        body: JSON.stringify({ sessionId, astrologerId: chat.astrologer.id, rating, comment }),
      });
      setReviewSubmitted(true);
    } catch (error: any) {
      Alert.alert("Could not submit review", error.message || "Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!chat) return <ChatSkeleton />;

  const name = chat.astrologer.user.name;
  const introActive = isFreeMinute && introSecondsLeft > 0;
  const sessionStartedAt = new Date(chat.startedAt).getTime();
  const hasHistory = chat.messages.some((message) => new Date(message.createdAt).getTime() < sessionStartedAt);
  const compactHeader = width < 380;
  const safeTop = Math.max(insets.top, Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0);
  const composerBottom = Math.max(insets.bottom, Platform.OS === "android" ? 16 : 12);
  const headerControls = (
    <View style={[styles.headerControls, compactHeader && styles.headerControlsCompact]}>
      <View style={styles.timerPill}>
        <Text style={styles.timerLabel}>{introActive ? "Intro left" : "Time"}</Text>
        <Text style={styles.timerText}>{introActive ? formatClock(introSecondsLeft) : formatDuration(duration)}</Text>
      </View>
      <Pressable style={styles.wallet} onPress={() => router.push("/(tabs)/wallet")}>
        <Text style={styles.walletText}>₹{Math.floor(balance)}</Text>
        <Text style={styles.plus}>+</Text>
      </Pressable>
      {!ended && <Pressable onPress={end} style={styles.end}><Text style={styles.endText}>End</Text></Pressable>}
    </View>
  );

  if (waitTimedOut && !astrologerJoined && !ended) {
    return <UnavailableScreen name={name} onBack={() => router.replace("/(tabs)/chats")} />;
  }

  if (!astrologerJoined && !ended) {
    return <WaitingRoom name={name} connected={connected} waitLeft={waitLeft} kundli={kundli} onCancel={cancelBeforeJoin} />;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.header, { paddingTop: safeTop + 8 }]}>
        <View style={styles.headerMain}>
          <Pressable onPress={() => router.back()} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>
          {chat.astrologer.profileImage ? (
            <Image source={{ uri: chat.astrologer.profileImage }} style={styles.avatarPhoto} />
          ) : (
            <View style={styles.avatar}><Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text></View>
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.status}>{typing ? "Typing..." : connected ? "Online" : "Connecting..."}</Text>
          </View>
          {!compactHeader ? headerControls : null}
        </View>
        {compactHeader ? headerControls : null}
      </View>

      {billingStarted && !ended ? (
        <View style={styles.liveStrip}>
          <Ionicons name="radio-button-on" size={12} color={colors.green} />
          <Text style={styles.liveText}>{introActive ? "₹1 intro pass active — wallet billing starts after this" : `Wallet billing active at ₹${chat.astrologer.ratePerMin}/min`}</Text>
        </View>
      ) : null}

      {billingStarted && !ended && !introActive && balance < chat.astrologer.ratePerMin * 2 ? (
        <View style={styles.lowBalance}>
          <View style={styles.lowCopy}>
            <Text style={styles.lowTitle}>Balance running low</Text>
            <Text style={styles.lowText}>Add money now to continue without interruption.</Text>
          </View>
          <Pressable disabled={recharging} style={({ pressed }) => [styles.lowButton, pressed && styles.lowButtonPressed, recharging && styles.lowButtonDisabled]} onPress={() => void rechargeInChat(50)}>
            {recharging ? <ActivityIndicator size="small" color="#1A1040" /> : <Text style={styles.lowButtonText}>+ ₹50</Text>}
          </Pressable>
        </View>
      ) : null}

      <View style={styles.chatArea}>
      <ZodiacPattern />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          ref={list}
          data={chat.messages}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={styles.messages}
          ListHeaderComponent={
            <View>
              {hasHistory ? <View style={styles.historyDivider}><Text style={styles.historyDividerText}>Previous conversation</Text></View> : null}
              {!hasHistory ? <View style={styles.today}><Text style={styles.todayText}>Today</Text></View> : null}
            </View>
          }
          renderItem={({ item, index }) => {
            const mine = item.senderId === user?.id;
            const parsed = parseMessageContent(item.content);
            const isCurrentMessage = new Date(item.createdAt).getTime() >= sessionStartedAt;
            const previousItem = index > 0 ? chat.messages[index - 1] : null;
            const showCurrentDivider = hasHistory && isCurrentMessage && (!previousItem || new Date(previousItem.createdAt).getTime() < sessionStartedAt);
            return (
              <>
                {showCurrentDivider ? <View style={styles.historyDivider}><Text style={styles.historyDividerText}>New session</Text></View> : null}
                <View style={[styles.messageRow, mine ? styles.mine : styles.theirs]}>
                <View style={[styles.bubble, parsed.type === "image" && styles.imageBubble, mine ? styles.mineBubble : styles.theirBubble]}>
                  {parsed.type === "image" ? (
                    <Image source={{ uri: parsed.uri }} style={styles.messageImage} />
                  ) : (
                    <Text style={[styles.messageText, mine && styles.mineText]}>{parsed.text}</Text>
                  )}
                </View>
                <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
              </View>
              </>
            );
          }}
          ListFooterComponent={typing ? <Text style={styles.typing}>{name} is typing...</Text> : null}
        />
        {ended ? (
          <View style={styles.ended}>
            <Text style={styles.endedTitle}>Session ended</Text>
            <Text style={styles.endedText}>{endReason === "insufficient_balance" ? "Your balance ran out during the session." : "Your consultation has ended."}</Text>
            {endReason === "insufficient_balance" ? (
              <Pressable disabled={recharging} style={styles.continue} onPress={() => void rechargeInChat(50)}>
                <Text style={styles.continueText}>{recharging ? "Opening payment..." : "Add ₹50 now"}</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.continue} onPress={() => router.push("/(tabs)/chats")}><Text style={styles.continueText}>Back to astrologers</Text></Pressable>
            )}
          </View>
        ) : (
          <View style={[styles.composer, { paddingBottom: composerBottom }]}>
            <Pressable onPress={sendImage} disabled={!astrologerJoined || ended} style={[styles.attach, (!astrologerJoined || ended) && styles.attachDisabled]}>
              <Ionicons name="image-outline" size={24} color={astrologerJoined && !ended ? colors.orange : "#A8A29E"} />
            </Pressable>
            <TextInput
              value={text}
              onChangeText={(value) => {
                setText(value);
                socket.current?.emit("typing", { sessionId, isTyping: !!value });
              }}
              placeholder={astrologerJoined ? "Type your message..." : "Waiting for astrologer to join..."}
              style={styles.input}
              multiline
              editable={astrologerJoined && !ended}
              onSubmitEditing={send}
            />
            <Pressable onPress={send} disabled={!text.trim() || !astrologerJoined} style={[styles.send, (!text.trim() || !astrologerJoined) && styles.sendDisabled]}><Text style={styles.sendText}>↑</Text></Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
      </View>

      <Modal visible={ended && astrologerJoined && !reviewSubmitted} transparent animationType="slide">
        <View style={styles.reviewOverlay}>
          <View style={styles.reviewCard}>
            <View style={styles.reviewIcon}><Ionicons name="star" size={28} color={colors.gold} /></View>
            <Text style={styles.reviewTitle}>Rate your session</Text>
            <Text style={styles.reviewText}>How was your consultation with {name}?</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable key={star} onPress={() => setRating(star)} hitSlop={8}>
                  <Ionicons name={star <= rating ? "star" : "star-outline"} size={34} color={star <= rating ? colors.gold : "#D6D0C7"} />
                </Pressable>
              ))}
            </View>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Share your experience (optional)"
              placeholderTextColor="#9CA3AF"
              multiline
              style={styles.reviewInput}
            />
            <View style={styles.reviewActions}>
              <Pressable style={styles.reviewSkip} onPress={() => setReviewSubmitted(true)}><Text style={styles.reviewSkipText}>Skip</Text></Pressable>
              <Pressable disabled={rating === 0 || submittingReview} style={[styles.reviewSubmit, (rating === 0 || submittingReview) && styles.reviewSubmitDisabled]} onPress={() => void submitReview()}>
                <Text style={styles.reviewSubmitText}>{submittingReview ? "Submitting..." : "Submit"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ZodiacPattern() {
  const symbols = ["♈", "☽", "✦", "♌", "♓", "♎", "☉", "♐", "✧", "♋", "♒", "♉"];
  return (
    <View pointerEvents="none" style={styles.pattern}>
      {symbols.map((symbol, index) => (
        <Text
          key={`${symbol}-${index}`}
          style={[
            styles.patternSymbol,
            {
              left: `${(index * 23) % 88}%`,
              top: `${8 + ((index * 17) % 78)}%`,
              transform: [{ rotate: `${index % 2 ? -13 : 11}deg` }],
            },
          ]}
        >
          {symbol}
        </Text>
      ))}
    </View>
  );
}

function parseMessageContent(content: string): ParsedMessage {
  try {
    const parsed = JSON.parse(content) as { type?: string; uri?: string };
    if (parsed.type === "image" && typeof parsed.uri === "string" && parsed.uri.startsWith("data:image/")) {
      return { type: "image", uri: parsed.uri };
    }
  } catch {
    // Plain text messages are stored directly in content.
  }
  return { type: "text", text: content };
}

function WaitingRoom({ name, connected, waitLeft, kundli, onCancel }: { name: string; connected: boolean; waitLeft: number; kundli: KundliProfile | null; onCancel: () => void }) {
  return (
    <SafeAreaView style={styles.waitingScreen}>
      <View style={styles.waitingCard}>
        <View style={styles.waitingIcon}>
          <Ionicons name="sparkles" size={38} color={colors.orangeDark} />
        </View>
        <Text style={styles.waitingTitle}>Connecting you to {name}</Text>
        <Text style={styles.waitingText}>Your kundli and chat request have been shared. We are alerting the astrologer now.</Text>
        <View style={styles.kundliBox}>
          <Ionicons name="planet-outline" size={17} color={colors.orangeDark} />
          <Text style={styles.kundliText} numberOfLines={1}>
            {kundli ? `${kundli.fullName} · ${kundli.placeOfBirth}` : "Kundli details shared securely"}
          </Text>
        </View>
        <View style={styles.stepGrid}>
          {["Kundli shared", "Alert sent", connected ? "Waiting to join" : "Connecting"].map((label, index) => (
            <View key={label} style={styles.stepCard}>
              <View style={[styles.stepDot, index < 2 && styles.stepDone]} />
              <Text style={styles.stepText}>{label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
        <Text style={styles.waitingHint}>Billing starts only after the astrologer joins · {Math.ceil(waitLeft / 60)} min window</Text>
        <Pressable style={({ pressed }) => [styles.cancelButton, pressed && styles.cancelPressed]} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel session</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function UnavailableScreen({ name, onBack }: { name: string; onBack: () => void }) {
  return (
    <SafeAreaView style={styles.waitingScreen}>
      <View style={styles.waitingCard}>
        <View style={styles.unavailableIcon}>
          <Ionicons name="hourglass-outline" size={38} color={colors.orangeDark} />
        </View>
        <Text style={styles.waitingTitle}>{name} could not join</Text>
        <Text style={styles.waitingText}>The session was cancelled before billing started. You have not been charged.</Text>
        <Pressable style={styles.backToAstros} onPress={onBack}>
          <Text style={styles.backToAstrosText}>Back to astrologers</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function ChatSkeleton() {
  return (
    <SafeAreaView style={styles.loading}>
      <View style={styles.skeletonHeader}>
        <Skeleton width={38} height={38} radius={19} />
        <Skeleton width={42} height={42} radius={21} />
        <View style={styles.headerInfo}>
          <SkeletonLine width="55%" height={16} />
          <SkeletonLine width="34%" height={11} style={styles.skeletonSmallGap} />
        </View>
        <Skeleton width={64} height={34} radius={18} />
      </View>
      <View style={styles.skeletonMessages}>
        <Skeleton width="62%" height={44} radius={16} />
        <Skeleton width="78%" height={62} radius={16} style={styles.skeletonRight} />
        <Skeleton width="50%" height={44} radius={16} />
        <Skeleton width="70%" height={54} radius={16} style={styles.skeletonRight} />
      </View>
      <View style={styles.skeletonComposer}>
        <Skeleton width="82%" height={48} radius={24} />
        <Skeleton width={48} height={48} radius={24} />
      </View>
    </SafeAreaView>
  );
}

function formatDuration(secs: number) {
  return `${Math.floor(secs / 60).toString().padStart(2, "0")}:${(secs % 60).toString().padStart(2, "0")}`;
}

function formatClock(secs: number) {
  return `${Math.floor(secs / 60).toString().padStart(2, "0")}:${(secs % 60).toString().padStart(2, "0")}`;
}

const headerTop = Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 12 : 12;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4EDE1" },
  flex: { flex: 1 },
  loading: { flex: 1, backgroundColor: colors.cream },
  skeletonHeader: { backgroundColor: "white", borderBottomWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingTop: headerTop, paddingBottom: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  skeletonMessages: { flex: 1, padding: 16, gap: 14 },
  skeletonRight: { alignSelf: "flex-end" },
  skeletonSmallGap: { marginTop: 6 },
  skeletonComposer: { flexDirection: "row", gap: 10, alignItems: "center", paddingHorizontal: 12, paddingTop: 12, paddingBottom: Platform.OS === "android" ? 16 : 12, backgroundColor: "white", borderTopWidth: 1, borderColor: colors.border },
  header: { backgroundColor: "#FFD45A", borderBottomWidth: 0, paddingHorizontal: 13, paddingBottom: 10, gap: 8, shadowColor: "#B7791F", shadowOpacity: 0.13, shadowRadius: 10, elevation: 3 },
  headerMain: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerControls: { flexDirection: "row", alignItems: "center", gap: 7, flexShrink: 0 },
  headerControlsCompact: { alignSelf: "stretch", justifyContent: "flex-end" },
  back: { width: 36, height: 36, borderRadius: 18, borderWidth: 0, backgroundColor: "rgba(255,255,255,.86)", alignItems: "center", justifyContent: "center" },
  backText: { fontSize: 29, lineHeight: 30, color: "#7A4300" },
  avatarPhoto: { height: 43, width: 43, borderRadius: 22, backgroundColor: "#FFF9E6", borderWidth: 2, borderColor: "white" },
  avatar: { height: 43, width: 43, borderRadius: 22, backgroundColor: "#FFF9E6", borderWidth: 2, borderColor: "white", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#7A4300", fontFamily: fonts.extrabold },
  headerInfo: { flex: 1, minWidth: 0 },
  name: { fontSize: 15.5, fontFamily: fonts.extrabold, color: colors.ink },
  status: { fontSize: 12.2, color: "#7A4300", marginTop: 1, fontFamily: fonts.medium },
  timerPill: { minWidth: 66, borderRadius: 14, backgroundColor: "#FFF8DD", borderWidth: 1, borderColor: "#EFD67E", paddingHorizontal: 8, paddingVertical: 5, alignItems: "center" },
  timerLabel: { fontFamily: fonts.extrabold, color: colors.orangeDark, fontSize: 8, textTransform: "uppercase" },
  timerText: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 11.5 },
  wallet: { borderWidth: 1.5, borderColor: "#91DAB8", paddingVertical: 7, paddingLeft: 8, paddingRight: 6, borderRadius: 20, flexDirection: "row", gap: 5, alignItems: "center" },
  walletText: { color: colors.green, fontSize: 12, fontFamily: fonts.extrabold },
  plus: { color: "white", backgroundColor: colors.green, width: 17, height: 17, borderRadius: 9, textAlign: "center", fontFamily: fonts.extrabold },
  end: { paddingHorizontal: 8, paddingVertical: 7, borderRadius: 18, backgroundColor: "#FFF0F0" },
  endText: { color: colors.red, fontFamily: fonts.extrabold, fontSize: 12 },
  liveStrip: { backgroundColor: "#ECFDF3", borderBottomWidth: 1, borderBottomColor: "#BDE9D2", paddingVertical: 7, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 7 },
  liveText: { fontFamily: fonts.bold, color: colors.green, fontSize: 12 },
  lowBalance: { backgroundColor: "#FFF7DF", borderBottomWidth: 1, borderBottomColor: "#ECD06D", paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  lowCopy: { flex: 1 },
  lowTitle: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 13 },
  lowText: { fontFamily: fonts.regular, color: colors.muted, fontSize: 11.5, marginTop: 1 },
  lowButton: { minWidth: 72, borderRadius: 13, backgroundColor: colors.gold, paddingHorizontal: 12, paddingVertical: 10, alignItems: "center" },
  lowButtonPressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  lowButtonDisabled: { opacity: 0.65 },
  lowButtonText: { fontFamily: fonts.extrabold, color: "#1A1040", fontSize: 13 },
  chatArea: { flex: 1, overflow: "hidden" },
  pattern: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  patternSymbol: { position: "absolute", color: "rgba(113,100,82,.08)", fontSize: 42, fontFamily: fonts.extrabold },
  messages: { padding: 16, gap: 7, paddingBottom: 22 },
  today: { alignItems: "center", paddingVertical: 8 },
  todayText: { backgroundColor: colors.ink, color: "white", paddingHorizontal: 16, paddingVertical: 7, borderRadius: 18, fontFamily: fonts.extrabold, fontSize: 12 },
  historyDivider: { alignItems: "center", paddingVertical: 9 },
  historyDividerText: { backgroundColor: "rgba(62,51,40,.78)", color: "white", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, fontFamily: fonts.extrabold, fontSize: 11 },
  messageRow: { maxWidth: "82%", marginTop: 4 },
  mine: { alignSelf: "flex-end", alignItems: "flex-end" },
  theirs: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 16 },
  imageBubble: { paddingHorizontal: 4, paddingVertical: 4, overflow: "hidden" },
  mineBubble: { backgroundColor: "#FFF0BE", borderBottomRightRadius: 4, borderWidth: 1, borderColor: "#F1D78E" },
  theirBubble: { backgroundColor: "white", borderBottomLeftRadius: 4, shadowColor: "#64748B", shadowOpacity: 0.08, shadowRadius: 5, elevation: 1 },
  messageImage: { width: 210, height: 260, borderRadius: 13, backgroundColor: "#EFE7DC" },
  messageText: { fontSize: 15, color: colors.ink, lineHeight: 21 },
  mineText: { color: "#4B3A19" },
  time: { fontSize: 11, color: colors.muted, marginTop: 3 },
  typing: { color: colors.muted, fontStyle: "italic", textAlign: "center", paddingVertical: 10 },
  composer: { flexDirection: "row", gap: 10, alignItems: "flex-end", paddingHorizontal: 12, paddingTop: 12, paddingBottom: Platform.OS === "android" ? 16 : 12, backgroundColor: "rgba(255,255,255,.96)", borderTopWidth: 1, borderColor: "#EFE4D6" },
  attach: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#F0D7B7", backgroundColor: "#FFF7EA" },
  attachDisabled: { backgroundColor: "#F2F2F2", borderColor: "#E1E1E1" },
  input: { flex: 1, borderWidth: 1, borderColor: "#D9DDE1", backgroundColor: "white", borderRadius: 25, paddingHorizontal: 17, paddingVertical: 12, fontSize: 16, maxHeight: 110 },
  send: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center", backgroundColor: "#FFB21C" },
  sendDisabled: { backgroundColor: "#D9DDE1" },
  sendText: { color: "white", fontSize: 25, fontFamily: fonts.extrabold },
  ended: { margin: 16, backgroundColor: "white", borderRadius: 18, padding: 20, alignItems: "center", gap: 8 },
  endedTitle: { fontFamily: fonts.extrabold, fontSize: 18, color: colors.ink },
  endedText: { color: colors.muted, textAlign: "center", fontFamily: fonts.regular },
  continue: { backgroundColor: colors.orange, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12, marginTop: 6 },
  continueText: { color: "white", fontFamily: fonts.extrabold },
  reviewOverlay: { flex: 1, backgroundColor: "rgba(30,41,59,.42)", justifyContent: "flex-end", padding: 14 },
  reviewCard: { backgroundColor: "#FFFEFC", borderRadius: 25, padding: 22, alignItems: "center" },
  reviewIcon: { width: 56, height: 56, borderRadius: 19, backgroundColor: "#FFF2D6", alignItems: "center", justifyContent: "center" },
  reviewTitle: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 22, marginTop: 12 },
  reviewText: { fontFamily: fonts.regular, color: colors.muted, fontSize: 13.5, textAlign: "center", marginTop: 4 },
  starRow: { flexDirection: "row", gap: 8, marginTop: 18, marginBottom: 14 },
  reviewInput: { alignSelf: "stretch", minHeight: 86, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: "#FAF8F5", padding: 13, textAlignVertical: "top", fontFamily: fonts.regular, color: colors.ink },
  reviewActions: { flexDirection: "row", gap: 10, alignSelf: "stretch", marginTop: 14 },
  reviewSkip: { flex: 1, borderRadius: 14, backgroundColor: "#F3F1EC", padding: 14, alignItems: "center" },
  reviewSkipText: { fontFamily: fonts.extrabold, color: colors.muted },
  reviewSubmit: { flex: 1, borderRadius: 14, backgroundColor: colors.orange, padding: 14, alignItems: "center" },
  reviewSubmitDisabled: { opacity: 0.55 },
  reviewSubmitText: { fontFamily: fonts.extrabold, color: "white" },
  waitingScreen: { flex: 1, backgroundColor: colors.cream, paddingTop: Platform.OS === "android" ? StatusBar.currentHeight || 0 : 0, justifyContent: "center", padding: 20 },
  waitingCard: { borderRadius: 28, backgroundColor: "#FFFEFC", borderWidth: 1, borderColor: "#EFE5D4", padding: 24, alignItems: "center", shadowColor: "#B97A1C", shadowOpacity: 0.12, shadowRadius: 18, elevation: 3 },
  waitingIcon: { width: 78, height: 78, borderRadius: 25, backgroundColor: "#FFF2D6", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  waitingTitle: { fontFamily: fonts.extrabold, color: colors.ink, fontSize: 24, lineHeight: 30, textAlign: "center" },
  waitingText: { fontFamily: fonts.regular, color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 8 },
  kundliBox: { alignSelf: "stretch", marginTop: 14, borderRadius: 15, backgroundColor: "#FFF9EA", borderWidth: 1, borderColor: "#F2DFA9", paddingHorizontal: 12, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 8 },
  kundliText: { flex: 1, fontFamily: fonts.bold, color: "#685D4B", fontSize: 12 },
  stepGrid: { flexDirection: "row", gap: 8, marginTop: 20 },
  stepCard: { flex: 1, borderRadius: 16, backgroundColor: "#FFF9EA", borderWidth: 1, borderColor: "#F2DFA9", padding: 10 },
  stepDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.orange, marginBottom: 7 },
  stepDone: { backgroundColor: colors.green },
  stepText: { fontFamily: fonts.bold, color: "#685D4B", fontSize: 10.5, lineHeight: 14 },
  progressTrack: { marginTop: 18, height: 7, borderRadius: 999, backgroundColor: "#F4E2B2", alignSelf: "stretch", overflow: "hidden" },
  progressFill: { width: "68%", height: "100%", borderRadius: 999, backgroundColor: colors.gold },
  waitingHint: { fontFamily: fonts.bold, color: colors.orangeDark, fontSize: 12, textAlign: "center", marginTop: 14 },
  cancelButton: { marginTop: 20, borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12, backgroundColor: "#FFF1F1" },
  cancelPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  cancelText: { fontFamily: fonts.extrabold, color: colors.red, fontSize: 13 },
  unavailableIcon: { width: 78, height: 78, borderRadius: 25, backgroundColor: "#FFF2D6", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  backToAstros: { marginTop: 22, borderRadius: 15, backgroundColor: colors.gold, paddingHorizontal: 20, paddingVertical: 13 },
  backToAstrosText: { fontFamily: fonts.extrabold, color: "#1A1040", fontSize: 14 },
});
