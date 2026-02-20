import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/AppNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "Storefront">;

function BeerBottle() {
  return (
    <View style={bottleStyles.wrapper}>
      {/* Tampinha */}
      <View style={bottleStyles.cap} />
      {/* Gargalo */}
      <View style={bottleStyles.neck} />
      {/* Corpo */}
      <View style={bottleStyles.body}>
        <View style={bottleStyles.label}>
          <Text style={bottleStyles.labelText}>BREJA</Text>
        </View>
      </View>
    </View>
  );
}

const bottleStyles = StyleSheet.create({
  wrapper: { alignItems: "center", marginVertical: 24 },
  cap: {
    width: 20,
    height: 10,
    backgroundColor: "#FF5A1F",
    borderWidth: 2,
    borderColor: "#000",
    borderRadius: 2,
  },
  neck: {
    width: 18,
    height: 30,
    backgroundColor: "#3A2F0B",
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: "#000",
  },
  body: {
    width: 60,
    height: 110,
    backgroundColor: "#3A2F0B",
    borderWidth: 3,
    borderColor: "#000",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: "#000",
  },
  labelText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#FF5A1F",
    letterSpacing: 2,
  },
});

export default function StorefrontScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.brand}>BREJA.ME</Text>
        <Text style={styles.tagline}>Delivery de cerveja</Text>

        {/* Product card */}
        <View style={styles.card}>
          <BeerBottle />
          <Text style={styles.productTitle}>1 Garrafa de Cerveja</Text>
          <Text style={styles.price}>R$ 12,90</Text>
        </View>

        {/* CTA */}
        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => navigation.navigate("AgeCheck")}
        >
          <Text style={styles.buttonText}>COMPRAR</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F5F5F0" },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: "center",
  },
  brand: {
    fontSize: 36,
    fontWeight: "900",
    color: "#FF5A1F",
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  card: {
    marginTop: 32,
    backgroundColor: "#FFF",
    borderWidth: 3,
    borderColor: "#000",
    width: "100%",
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  productTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A1A",
    textAlign: "center",
  },
  price: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FF5A1F",
    marginTop: 8,
  },
  button: {
    marginTop: 40,
    backgroundColor: "#FF5A1F",
    paddingVertical: 20,
    paddingHorizontal: 64,
    borderWidth: 3,
    borderColor: "#000",
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  buttonPressed: {
    shadowOffset: { width: 1, height: 1 },
    transform: [{ translateX: 3 }, { translateY: 3 }],
  },
  buttonText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 3,
  },
});
