import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Alert,
} from "react-native";
import {
  addPendingScan,
  findLocalAssetByCode,
  isAlreadyScanned,
  getPendingScansForControl,
  deletePendingScan,
} from "../services/sqlite";
import * as Haptics from "expo-haptics";

type Props = {
  navigation: any;
  route: { params: { controlId: string; controlName?: string } };
};

type ScanResult = {
  id: number;
  code: string;
  type: "ok" | "duplicate" | "not_found";
  message: string;
};

export default function ScanScreen({ navigation, route }: Props) {
  const { controlId, controlName } = route.params;
  const [code, setCode] = useState("");
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);

  const refreshRecent = useCallback(async () => {
    const scans = await getPendingScansForControl(controlId);
    setRecentScans(
      scans.map((s) => ({
        id: s.id,
        code: s.mb,
        type: "ok" as const,
        message: `${s.mb} registrado`,
      }))
    );
  }, [controlId]);

  // Cargar escaneos existentes al montar la pantalla
  useEffect(() => {
    refreshRecent();
  }, [refreshRecent]);

  const handleScan = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;

    const asset = await findLocalAssetByCode(controlId, code);

    if (!asset) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("No encontrado", `${code} no pertenece a este control`);
      setRecentScans((prev) => [
        { id: 0, code, type: "not_found", message: `${code} no pertenece a este control` },
        ...prev.slice(0, 9),
      ]);
      setCode("");
      return;
    }

    const already = await isAlreadyScanned(controlId, code);

    if (already) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Ya registrado", `${code} ya fue escaneado anteriormente`);
      setRecentScans((prev) => [
        { id: 0, code, type: "duplicate", message: `${code} ya fue registrado` },
        ...prev.slice(0, 9),
      ]);
      setCode("");
      return;
    }

    await addPendingScan(controlId, code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Registrado", `${code} registrado correctamente`);
    await refreshRecent();
    setCode("");
  };

  const handleDelete = (item: ScanResult) => {
    if (item.type !== "ok" || item.id === 0) return;
    Alert.alert("Eliminar escaneo", `Eliminar ${item.code} de la lista?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deletePendingScan(item.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          await refreshRecent();
        },
      },
    ]);
  };

  const openCamera = () => {
    navigation.navigate("QrScanner", { controlId, onScan: handleScan });
  };

  const getRowStyle = (type: ScanResult["type"]) => {
    switch (type) {
      case "ok": return styles.recentOk;
      case "duplicate": return styles.recentDuplicate;
      case "not_found": return styles.recentNotFound;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Escanear Activos</Text>
          <Text style={styles.subtitle}>{controlName || "Control"}</Text>
        </View>
      </View>

      <View style={styles.cameraBtn}>
        <TouchableOpacity style={styles.cameraCircle} onPress={openCamera}>
          <Text style={styles.cameraIcon}>Camara</Text>
          <Text style={styles.cameraText}>Abrir Camara QR</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>o entrada manual</Text>
        <View style={styles.dividerLine} />
      </View>

      <View style={styles.manualArea}>
        <TextInput
          style={styles.input}
          placeholder="Ej: MB10001"
          placeholderTextColor="#94a3b8"
          value={code}
          onChangeText={setCode}
          onSubmitEditing={() => handleScan(code)}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[styles.submitBtn, !code.trim() && styles.submitBtnDisabled]}
          onPress={() => handleScan(code)}
          disabled={!code.trim()}
        >
          <Text style={styles.submitText}>Registrar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.recentTitle}>Escaneos registrados ({recentScans.filter(s => s.type === "ok").length})</Text>
      <FlatList
        data={recentScans}
        keyExtractor={(item, i) => (item.id > 0 ? item.id.toString() : `tmp-${i}`)}
        contentContainerStyle={styles.recentList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.recentItem, getRowStyle(item.type)]}
            onLongPress={() => handleDelete(item)}
            delayLongPress={400}
          >
            <Text style={styles.recentText}>{item.message}</Text>
            {item.type === "ok" && item.id > 0 && (
              <Text style={styles.deleteHint}>Mantener presionado para eliminar</Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.recentEmpty}>Aun no hay escaneos registrados.</Text>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e3a5f",
  },
  header: {
    padding: 20,
    paddingTop: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    padding: 8,
  },
  backText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
  },
  subtitle: {
    fontSize: 12,
    color: "#cbd5e1",
  },
  cameraBtn: {
    alignItems: "center",
    padding: 24,
  },
  cameraCircle: {
    backgroundColor: "#2563eb",
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  cameraIcon: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "800",
  },
  cameraText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
    marginTop: 4,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 32,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dividerText: {
    color: "#cbd5e1",
    fontSize: 12,
    paddingHorizontal: 12,
  },
  manualArea: {
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#0f172a",
  },
  submitBtn: {
    backgroundColor: "#16a34a",
    borderRadius: 10,
    paddingHorizontal: 18,
    justifyContent: "center",
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  recentTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  recentList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  recentItem: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
  },
  recentOk: {
    backgroundColor: "rgba(34,197,94,0.2)",
    borderColor: "#16a34a",
  },
  recentDuplicate: {
    backgroundColor: "rgba(234,179,8,0.2)",
    borderColor: "#eab308",
  },
  recentNotFound: {
    backgroundColor: "rgba(239,68,68,0.2)",
    borderColor: "#ef4444",
  },
  recentText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  deleteHint: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    marginTop: 4,
  },
  recentEmpty: {
    color: "#cbd5e1",
    textAlign: "center",
    fontSize: 12,
    padding: 16,
    fontStyle: "italic",
  },
});
