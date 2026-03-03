import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Underage">;

export default function UnderageScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconBox}>
          <Text style={styles.icon}>🚫</Text>
        </View>

        <Text style={styles.title}>Venda não permitida</Text>
        <Text style={styles.body}>
          Você precisa ter 18 anos ou mais para comprar bebida alcoólica.
        </Text>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.buttonText}>Voltar para vitrine</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: "#DC2626" 
  },
  container: { 
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24
  },
  iconBox: {
    width: 120, 
    height: 120, 
    borderWidth: 4, 
    borderColor: "#000",
    backgroundColor: "#FFF", 
    alignItems: "center", 
    justifyContent: "center",
    shadowColor: "#000", 
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1, 
    shadowRadius: 0, 
    elevation: 10,
  },
  icon: { 
    fontSize: 64
  },
  title: { 
    fontSize: 34, 
    fontWeight: "900", 
    color: "#FFF", 
    marginTop: 32, 
    textAlign: "center" 
  },
  body: { 
    fontSize: 18, 
    color: "#FEE2E2", 
    marginTop: 12, 
    textAlign: "center", 
    lineHeight: 26, 
    fontWeight: "600" 
  },
  button: {
    marginTop: 48, 
    backgroundColor: "#FFF", 
    paddingVertical: 16, 
    paddingHorizontal: 36,
    borderWidth: 3, 
    borderColor: "#000", 
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 }, 
    shadowOpacity: 1, 
    shadowRadius: 0, 
    elevation: 8,
  },
  buttonPressed: { 
    shadowOffset: { width: 1, height: 1 }, transform: [{ translateX: 3 }, { translateY: 3 }] 
  },
  buttonText: { 
    fontSize: 18, 
    fontWeight: "800", 
    color: "#1A1A1A", 
    letterSpacing: 1
  },
});
