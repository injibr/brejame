import { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Modal } from "react-native";

type Props = {
  visible: boolean;
};

export function LoadingOverlay({ visible }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 600, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [visible, pulse]);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Animated.Text style={[styles.icon, { transform: [{ scale: pulse }] }]}>🍺</Animated.Text>
          <Text style={styles.title}>Verificando...</Text>
          <Text style={styles.body}>Aguardando confirmação{"\n"}da sua carteira digital.</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: '#FFF', padding: 36, alignItems: 'center',
    borderWidth: 3, borderColor: '#000',
    shadowColor: '#000', shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 10,
    gap: 12,
  },
  icon: { fontSize: 52 },
  title: { fontSize: 26, fontWeight: '900', color: '#1A1A1A' },
  body: { fontSize: 16, color: '#555', textAlign: 'center', lineHeight: 24 },
});
