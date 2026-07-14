import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';

export default function TabLayout() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <Tabs screenOptions={{ 
      headerShown: false,
      tabBarStyle: { backgroundColor: '#000000', borderTopWidth: 0, paddingBottom: 5, height: 60 },
      tabBarActiveTintColor: '#ffffff',
      tabBarInactiveTintColor: '#b3b3b3',
    }}>
      {/* ALWAYS SHOW HOME */}
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home', 
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} /> 
        }} 
      />

      {/* AUTHENTICATED ONLY */}
      <Tabs.Screen 
        name="search" 
        options={{ 
          title: 'Search', 
          href: isAuthenticated ? '/search' : null,
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "search" : "search-outline"} size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="library" 
        options={{ 
          title: 'Library', 
          href: isAuthenticated ? '/library' : null,
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "library" : "library-outline"} size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="downloads" 
        options={{ 
          title: 'Downloads', 
          href: isAuthenticated ? '/downloads' : null,
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "cloud-download" : "cloud-download-outline"} size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="allsongs" 
        options={{ 
          title: 'All Songs', 
          href: isAuthenticated ? '/allsongs' : null,
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "musical-notes" : "musical-notes-outline"} size={24} color={color} /> 
        }} 
      />

      {/* HIDDEN TABS (No tab icon, but keeps the tab bar visible) */}
      <Tabs.Screen name="create" options={{ href: null, title: 'Create' }} />
      <Tabs.Screen name="addsong" options={{ href: null, title: 'Add Song' }} />
      <Tabs.Screen name="profile" options={{ href: null, title: 'Profile' }} />

      {/* GUEST ONLY */}
      <Tabs.Screen 
        name="signup" 
        options={{ 
          title: 'Sign Up', 
          href: !isAuthenticated ? '/signup' : null,
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "person-add" : "person-add-outline"} size={24} color={color} /> 
        }} 
      />
      <Tabs.Screen 
        name="login" 
        options={{ 
          title: 'Log In', 
          href: !isAuthenticated ? '/login' : null,
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "log-in" : "log-in-outline"} size={24} color={color} /> 
        }} 
      />
    </Tabs>
  );
}
