"use client";

import { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  TextInput,
  Button,
  Appbar,
  Chip,
  Menu,
} from "react-native-paper";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppSelector } from "../../store/hooks";
import type { TaskPriority, TaskCategory } from "../../store/slices/taskSlice";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../api/firebase/config";

const CreateTaskTemplateScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const { user } = useAppSelector((state) => state.auth);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [category, setCategory] = useState<TaskCategory>("other");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [categoryMenuVisible, setCategoryMenuVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateTemplate = async () => {
    if (!title.trim() || !user) return;

    setIsLoading(true);
    try {
      const timestamp = Date.now();
      await addDoc(collection(db, "taskTemplates"), {
        title,
        description,
        priority,
        category,
        tags,
        createdBy: user.id,
        createdAt: timestamp,
      });

      navigation.goBack();
    } catch (error) {
      console.error("Failed to create template:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const getCategoryColor = (cat: TaskCategory): string => {
    switch (cat) {
      case "work":
        return "#4285F4"; // Blue
      case "personal":
        return "#EA4335"; // Red
      case "shopping":
        return "#FBBC05"; // Yellow
      case "health":
        return "#34A853"; // Green
      case "finance":
        return "#8E24AA"; // Purple
      default:
        return "#757575"; // Gray
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Appbar.Header style={{ backgroundColor: "black" }}>
        <Appbar.BackAction
          color="white"
          onPress={() => navigation.goBack()}
        />
        <Appbar.Content
          title="Create Task Template"
          color={theme.colors.onPrimary}
        />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            mode="outlined"
            label="Template Title"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={styles.input}
            mode="outlined"
            label="Description (Optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />

          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Category
          </Text>
          <Menu
            visible={categoryMenuVisible}
            onDismiss={() => setCategoryMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setCategoryMenuVisible(true)}
                style={[
                  styles.categoryButton,
                  { borderColor: getCategoryColor(category) },
                ]}
                labelStyle={{ color: getCategoryColor(category) }}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Button>
            }
          >
            <Menu.Item
              title="Work"
              onPress={() => {
                setCategory("work");
                setCategoryMenuVisible(false);
              }}
              leadingIcon="briefcase"
            />
            <Menu.Item
              title="Personal"
              onPress={() => {
                setCategory("personal");
                setCategoryMenuVisible(false);
              }}
              leadingIcon="account"
            />
            <Menu.Item
              title="Shopping"
              onPress={() => {
                setCategory("shopping");
                setCategoryMenuVisible(false);
              }}
              leadingIcon="cart"
            />
            <Menu.Item
              title="Health"
              onPress={() => {
                setCategory("health");
                setCategoryMenuVisible(false);
              }}
              leadingIcon="heart"
            />
            <Menu.Item
              title="Finance"
              onPress={() => {
                setCategory("finance");
                setCategoryMenuVisible(false);
              }}
              leadingIcon="cash"
            />
            <Menu.Item
              title="Other"
              onPress={() => {
                setCategory("other");
                setCategoryMenuVisible(false);
              }}
              leadingIcon="dots-horizontal"
            />
          </Menu>

          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.primary, marginTop: 16 },
            ]}
          >
            Tags
          </Text>
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <Chip
                key={index}
                style={styles.tagChip}
                onClose={() => handleRemoveTag(tag)}
              >
                {tag}
              </Chip>
            ))}
          </View>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              mode="outlined"
              label="Add Tag"
              value={newTag}
              onChangeText={setNewTag}
            />
            <Button
              mode="contained"
              onPress={handleAddTag}
              style={styles.addTagButton}
              disabled={!newTag.trim()}
            >
              Add
            </Button>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
            Priority
          </Text>
          <View style={styles.priorityContainer}>
            <Button
              mode={priority === "low" ? "contained" : "outlined"}
              onPress={() => setPriority("low")}
              style={styles.priorityButton}
            >
              Low
            </Button>
            <Button
              mode={priority === "medium" ? "contained" : "outlined"}
              onPress={() => setPriority("medium")}
              style={styles.priorityButton}
            >
              Medium
            </Button>
            <Button
              mode={priority === "high" ? "contained" : "outlined"}
              onPress={() => setPriority("high")}
              style={styles.priorityButton}
            >
              High
            </Button>
          </View>

          <Button
            mode="contained"
            style={[
              styles.createButton,
              { backgroundColor: theme.colors.primary },
            ]}
            loading={isLoading}
            disabled={isLoading || !title.trim()}
            onPress={handleCreateTemplate}
          >
            Save Template
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  formCard: {
    backgroundColor: "white",
    margin: 8,
    padding: 16,
    borderRadius: 8,
  },
  input: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  categoryButton: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
    gap: 8,
  },
  tagChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  tagInputContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "center",
  },
  tagInput: {
    flex: 1,
    marginRight: 8,
  },
  addTagButton: {
    marginTop: 8,
  },
  priorityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  priorityButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  createButton: {
    marginTop: 8,
    paddingVertical: 8,
  },
});

export default CreateTaskTemplateScreen;
