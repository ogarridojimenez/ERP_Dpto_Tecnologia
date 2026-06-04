import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from "react-native";
import { supabase } from "../services/supabase";
import { downloadControlAssets, syncControlScans, SyncProgress } from "../services/sync";
import { getPendingScansCount, getAssetsCount, setMeta, getMeta } from "../services/sqlite";

type Control = {
  id: string;
  area_id: string;
  fecha_planificada: string;
  estado: string;
  observaciones: string | null;
  areas_aft: { codigo: string; nombre: string } | null;
};

type Props = {
  navigation: any;
};

export default function HomeScreen({ navigation }: Props) {
  const [controls, setControls] = useState<Control[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pendingByControl, setPendingByControl] = useState<Record<string, number>>({});
  const [downloadedByControl, setDownloadedByControl] = useState<Record<string, number>>({});

  const [downloading, setDownloading] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [showProgress, setShowProgress] = useState(false);

  const loadData = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("controles_aft")
        .select("id, area_id, fecha_planificada, estado, observaciones, areas_aft(codigo, nombre)")
        .in("estado", ["planificado", "en_curso"])
        .is("deleted_at", null)
        .order("fecha_planificada", { ascending: false });

      if (error) throw error;
      setControls((data as Control[]) || []);

      const pending: Record<string, number> = {};
      const downloaded: Record<string, number> = {};
      for (const c of data || []) {
        pending[c.id] = await getPendingScansCount(c.id);
        downloaded[c.id] = await getAssetsCount(c.id);
      }
      setPendingByControl(pending);
      setDownloadedByControl(downloaded);
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener("focus", loadData);
    return unsub;
  }, [navigation, loadData]);

  const handleDownload = async (control: Control) => {
    setDownloading(control.id);
    try {
      const count = await downloadControlAssets(control.id);
      await setMeta(`last_control_${control.id}`, new Date().toISOString());
      Alert.alert("Descarga completa", `${count} activos descargados para uso offline.`);
      loadData();
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    } finally {
      setDownloading(null);
    }
  };

  const handleSync = async (control: Control) => {
    setShowProgress(true);
    setSyncProgress({ current: 0, total: 0, status: "syncing", message: "Iniciando..." });
    try {
      await syncControlScans(control.id, (p) => setSyncProgress(p));
    } catch (e) {
      setSyncProgress({ current: 0, total: 0, status: "error", message: (e as Error).message });
    } finally {
      setTimeout(() => {
        setShowProgress(false);
        loadData();
      }, 1500);
    }
  };

  const renderItem = ({ item }: { item: Control }) => {
    const downloaded = downloadedByControl[item.id] || 0;
    const pending = pendingByControl[item.id] || 0;
    const isDownloading = downloading === item.id;
    const isReady = downloaded > 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardCode}>
              {item.areas_aft?.codigo || "—"}
            </Text>
            <Text style={styles.cardName}>
              {item.areas_aft?.nombre || "Area"}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              item.estado === "planificado" ? styles.statusPlanificado : styles.statusEnCurso,
            ]}
          >
            <Text style={styles.statusText}>{item.estado.toUpperCase()}</Text>
          </View>
        </View>

        <Text style={styles.cardDate}>
          {new Date(item.fecha_planificada).toLocaleDateString("es-ES")}
        </Text>

        {isReady && (
          <Text style={styles.cardStats}>
            {downloaded} activos descargados · {pending} escaneos pendientes
          </Text>
        )}

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.btnPrimary]}
            onPress={() => handleDownload(item)}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.btnPrimaryText}>
                {isReady ? "Re-descargar" : "Descargar Activos"}
              </Text>
            )}
          </TouchableOpacity>

          {isReady && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, styles.btnSecondary]}
                onPress={() => navigation.navigate("Scan", { controlId: item.id, controlName: item.areas_aft?.codigo })}
              >
                <Text style={styles.btnSecondaryText}>Escanear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.btnSecondary]}
                onPress={() => navigation.navigate("LocalAssets", { controlId: item.id, controlName: item.areas_aft?.codigo })}
              >
                <Text style={styles.btnSecondaryText}>Ver Lista</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {pending > 0 && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.btnSync, { marginTop: 8 }]}
            onPress={() => handleSync(item)}
          >
            <Text style={styles.btnPrimaryText}>Sincronizar {pending} escaneos</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a5f" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>AFT Mobile</Text>
          <Text style={styles.headerSubtitle}>Inventario de Activos Fijos</Text>
        </View>
      </View>

      <FlatList
        data={controls}
        keyExtractor={(c) => c.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor="#1e3a5f" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>Sin controles</Text>
            <Text style={styles.emptyText}>
              No hay controles activos.{"\n"}
              Pida al administrador que cree un control desde el portal web.
            </Text>
          </View>
        }
      />

      <Modal visible={showProgress} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.modalTitle}>
              {syncProgress?.status === "error" ? "Error" : "Sincronizando"}
            </Text>
            <Text style={styles.modalText}>
              {syncProgress?.message || "Procesando..."}
            </Text>
            {syncProgress && syncProgress.total > 0 && (
              <Text style={styles.modalProgress}>
                {syncProgress.current} / {syncProgress.total}
              </Text>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
  },
  header: {
    backgroundColor: "#1e3a5f",
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#cbd5e1",
    marginTop: 2,
  },
  list: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardCode: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1e3a5f",
  },
  cardName: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPlanificado: {
    backgroundColor: "#fef3c7",
  },
  statusEnCurso: {
    backgroundColor: "#dbeafe",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#1e3a5f",
  },
  cardDate: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 8,
  },
  cardStats: {
    fontSize: 12,
    color: "#0f172a",
    marginTop: 8,
    fontWeight: "600",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    flexWrap: "wrap",
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
    minWidth: 100,
    alignItems: "center",
  },
  btnPrimary: {
    backgroundColor: "#2563eb",
  },
  btnPrimaryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  btnSecondary: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  btnSecondaryText: {
    color: "#1e3a5f",
    fontSize: 12,
    fontWeight: "800",
  },
  btnSync: {
    backgroundColor: "#16a34a",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 24,
    marginBottom: 12,
  },
  emptyText: {
    textAlign: "center",
    color: "#64748b",
    fontSize: 14,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 32,
    width: "100%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
    marginTop: 16,
  },
  modalText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    marginTop: 8,
  },
  modalProgress: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563eb",
    marginTop: 12,
  },
});
