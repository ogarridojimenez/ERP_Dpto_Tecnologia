import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { getLocalAssets, getPendingScansForControl } from "../services/sqlite";

type Asset = {
  id: number;
  mb: string;
  descripcion: string | null;
};

type Props = {
  navigation: any;
  route: { params: { controlId: string; controlName?: string } };
};

export default function LocalAssetsScreen({ navigation, route }: Props) {
  const { controlId, controlName } = route.params;
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filtered, setFiltered] = useState<Asset[]>([]);
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [scannedMbs, setScannedMbs] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    setRefreshing(true);
    const data = await getLocalAssets(controlId);
    setAssets(data);
    setFiltered(data);

    const scans = await getPendingScansForControl(controlId);
    setScannedMbs(new Set(scans.map((s) => s.mb)));
    setRefreshing(false);
  }, [controlId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(assets);
      return;
    }
    const q = search.toLowerCase();
    setFiltered(
      assets.filter(
        (a) =>
          a.mb.toLowerCase().includes(q) ||
          (a.descripcion && a.descripcion.toLowerCase().includes(q))
      )
    );
  }, [search, assets]);

  const renderItem = ({ item }: { item: Asset }) => {
    const isScanned = scannedMbs.has(item.mb);
    return (
      <View style={[styles.row, isScanned && styles.rowScanned]}>
        <View style={styles.rowLeft}>
          <Text style={[styles.code, isScanned && styles.codeScanned]}>
            {item.mb}
          </Text>
          <Text style={styles.desc}>
            {item.descripcion || "—"}
          </Text>
        </View>
        <View style={styles.rowRight}>
          {isScanned ? (
            <Text style={styles.scannedBadge}>Escaneado</Text>
          ) : (
            <Text style={styles.pendingBadge}>Pendiente</Text>
          )}
        </View>
      </View>
    );
  };

  const progress = assets.length > 0 ? Math.round((scannedMbs.size / assets.length) * 100) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Activos del Control</Text>
          <Text style={styles.subtitle}>{controlName || "Area"}</Text>
        </View>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{assets.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#16a34a" }]}>{scannedMbs.size}</Text>
          <Text style={styles.statLabel}>Escaneados</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#f59e0b" }]}>{assets.length - scannedMbs.size}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#2563eb" }]}>{progress}%</Text>
          <Text style={styles.statLabel}>Progreso</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <TextInput
        style={styles.search}
        placeholder="Buscar por MB o descripcion..."
        value={search}
        onChangeText={setSearch}
        autoCapitalize="characters"
      />

      <FlatList
        data={filtered}
        keyExtractor={(a) => a.mb}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  header: {
    backgroundColor: "#1e3a5f",
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
  statsBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f172a",
  },
  statLabel: {
    fontSize: 10,
    color: "#64748b",
    textTransform: "uppercase",
    fontWeight: "700",
    marginTop: 2,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#e2e8f0",
  },
  progressFill: {
    height: 6,
    backgroundColor: "#2563eb",
  },
  search: {
    backgroundColor: "#fff",
    margin: 16,
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  row: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowScanned: {
    backgroundColor: "#f0fdf4",
    borderLeftWidth: 3,
    borderLeftColor: "#16a34a",
  },
  rowLeft: {
    flex: 1,
  },
  rowRight: {},
  code: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f172a",
    fontFamily: "monospace",
  },
  codeScanned: {
    color: "#15803d",
  },
  desc: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  scannedBadge: {
    color: "#15803d",
    fontWeight: "700",
    fontSize: 12,
  },
  pendingBadge: {
    color: "#a16207",
    fontWeight: "700",
    fontSize: 12,
  },
});
