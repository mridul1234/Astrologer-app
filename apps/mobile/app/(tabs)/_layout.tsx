import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/ui";
const icon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: string; size: number }) => <Ionicons name={name} color={color} size={size} />;
export default function TabsLayout() { return <Tabs initialRouteName="chats" screenOptions={{ headerShown:false, tabBarActiveTintColor:colors.orange, tabBarInactiveTintColor:"#98A0AB", tabBarStyle:{borderTopColor:colors.border} }}>
  <Tabs.Screen name="home" options={{ title:"Home", tabBarIcon:icon("home-outline") }} />
  <Tabs.Screen name="chats" options={{ title:"Chats", tabBarIcon:icon("chatbubbles-outline") }} />
  <Tabs.Screen name="wallet" options={{ title:"Wallet", tabBarIcon:icon("wallet-outline") }} />
  <Tabs.Screen name="profile" options={{ title:"Profile", tabBarIcon:icon("person-outline") }} />
</Tabs>; }
