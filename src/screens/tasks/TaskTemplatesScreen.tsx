"use client";

import { useState, useEffect } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import {
  Text,
  Appbar,
  FAB,
  Card,
  Button,
  ActivityIndicator,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppSelector } from "../../store/hooks";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../api/firebase/config";

interface TaskTemplate {
  id: string;
  title: string;
  description?: string;
  priority: string;
  category: string;
  tags?: string[];
  createdBy: string;
  createdAt: number;
}

const TaskTemplatesScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { user } = useAppSelector((state) => state.auth);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const templatesRef = collection(db, "taskTemplates");
      const q = query(templatesRef, where("createdBy", "==", user.id));
      const querySnapshot = await getDocs(q);

      const templatesList: TaskTemplate[] = [];
      querySnapshot.forEach((doc) => {
        templatesList.push({
          id: doc.id,
          ...doc.data(),
        } as TaskTemplate);
      });

      setTemplates(templatesList);
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseTemplate = (template: TaskTemplate) => {
    navigation.navigate("CreateTask", { template });
  };

  const renderTemplateItem = ({ item }: { item: TaskTemplate }) => (
    <Card style={styles.templateCard}>
      <Card.Content>
        <Text style={styles.templateTitle}>{item.title}</Text>
        {item.description && (
          <Text style={styles.templateDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        <View style={styles.templateMeta}>
          <Text style={styles.templateMetaText}>
            Priority:{" "}
            {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
          </Text>
          <Text style={styles.templateMetaText}>
            Category:{" "}
            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
          </Text>
        </View>
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsLabel}>Tags: </Text>
            <Text style={styles.tagsText}>{item.tags.join(", ")}</Text>
          </View>
        )}
      </Card.Content>
      <Card.Actions>
        <Button onPress={() => handleUseTemplate(item)}>Use Template</Button>
      </Card.Actions>
    </Card>
  );

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={{ backgroundColor: theme.colors.primary }}>
        <Appbar.BackAction
          color={theme.colors.onPrimary}
          onPress={() => navigation.goBack()}
        />
        <Appbar.Content title="Task Templates" color={theme.colors.onPrimary} />
      </Appbar.Header>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          data={templates}
          renderItem={renderTemplateItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No templates found</Text>
              <Text style={styles.emptySubText}>
                Create a template to save time when creating similar tasks
              </Text>
            </View>
          }
        />
      )}

      <FAB
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        icon="plus"
        color={theme.colors.onPrimary}
        onPress={() => navigation.navigate("CreateTaskTemplate")}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    padding: 16,
  },
  templateCard: {
    marginBottom: 8,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  templateDescription: {
    fontSize: 14,
    color: "#555",
    marginBottom: 8,
  },
  templateMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  templateMetaText: {
    fontSize: 14,
    color: "#777",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tagsLabel: {
    fontSize: 14,
    color: "#777",
  },
  tagsText: {
    fontSize: 14,
    color: "#777",
    flex: 1,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#8E8E93",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default TaskTemplatesScreen;
