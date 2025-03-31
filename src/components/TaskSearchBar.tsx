"use client";

import { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Searchbar, Chip } from "react-native-paper";
import { useTheme } from "../theme/ThemeProvider";
import { useAppDispatch } from "../store/hooks";
import {
  setSearchQuery,
  setFilters,
  clearFilters,
} from "../store/slices/taskSlice";

const TaskSearchBar = () => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    {}
  );

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      dispatch(setSearchQuery(localSearchQuery));
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [localSearchQuery, dispatch]);

  const handleFilterSelect = (filterType: string, value: string) => {
    const newFilters = { ...activeFilters };

    if (newFilters[filterType] === value) {
      delete newFilters[filterType];
    } else {
      newFilters[filterType] = value;
    }

    setActiveFilters(newFilters);
    dispatch(setFilters(newFilters));
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    dispatch(clearFilters());
  };

  const isFilterActive = (filterType: string, value: string) => {
    return activeFilters[filterType] === value;
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search tasks..."
        onChangeText={setLocalSearchQuery}
        value={localSearchQuery}
        style={[
          styles.searchBar,
          { backgroundColor: theme.dark ? "#333333" : "#f5f5f5" },
        ]}
        inputStyle={[styles.searchInput, { color: theme.colors.text }]}
        iconColor={theme.colors.primary}
        placeholderTextColor={theme.colors.textSecondary}
        onFocus={() => setShowFilters(true)}
        theme={{
          colors: {
            text: theme.colors.text,
            placeholder: theme.colors.textSecondary,
            primary: theme.colors.primary,
          },
        }}
      />

      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Chip
                selected={isFilterActive("status", "todo")}
                onPress={() => handleFilterSelect("status", "todo")}
                style={[
                  styles.filterChip,
                  isFilterActive("status", "todo") && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                textStyle={{
                  color: isFilterActive("status", "todo")
                    ? theme.colors.onPrimary
                    : theme.colors.text,
                }}
              >
                To Do
              </Chip>
              <Chip
                selected={isFilterActive("status", "inProgress")}
                onPress={() => handleFilterSelect("status", "inProgress")}
                style={[
                  styles.filterChip,
                  isFilterActive("status", "inProgress") && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                textStyle={{
                  color: isFilterActive("status", "inProgress")
                    ? theme.colors.onPrimary
                    : theme.colors.text,
                }}
              >
                In Progress
              </Chip>
              <Chip
                selected={isFilterActive("status", "completed")}
                onPress={() => handleFilterSelect("status", "completed")}
                style={[
                  styles.filterChip,
                  isFilterActive("status", "completed") && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                textStyle={{
                  color: isFilterActive("status", "completed")
                    ? theme.colors.onPrimary
                    : theme.colors.text,
                }}
              >
                Completed
              </Chip>
            </View>
          </View>

          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Chip
                selected={isFilterActive("priority", "high")}
                onPress={() => handleFilterSelect("priority", "high")}
                style={[
                  styles.filterChip,
                  isFilterActive("priority", "high") && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                textStyle={{
                  color: isFilterActive("priority", "high")
                    ? theme.colors.onPrimary
                    : theme.colors.text,
                }}
              >
                High Priority
              </Chip>
              <Chip
                selected={isFilterActive("priority", "medium")}
                onPress={() => handleFilterSelect("priority", "medium")}
                style={[
                  styles.filterChip,
                  isFilterActive("priority", "medium") && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                textStyle={{
                  color: isFilterActive("priority", "medium")
                    ? theme.colors.onPrimary
                    : theme.colors.text,
                }}
              >
                Medium
              </Chip>
              <Chip
                selected={isFilterActive("priority", "low")}
                onPress={() => handleFilterSelect("priority", "low")}
                style={[
                  styles.filterChip,
                  isFilterActive("priority", "low") && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                textStyle={{
                  color: isFilterActive("priority", "low")
                    ? theme.colors.onPrimary
                    : theme.colors.text,
                }}
              >
                Low
              </Chip>
            </View>
          </View>

          {Object.keys(activeFilters).length > 0 && (
            <Chip
              onPress={handleClearFilters}
              style={[
                styles.clearChip,
                { backgroundColor: theme.dark ? "#444444" : "#f0f0f0" },
              ]}
              textStyle={{ color: theme.colors.error }}
            >
              Clear Filters
            </Chip>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 0,
    borderRadius: 8,
  },
  searchInput: {
    paddingVertical: 0,
    height: 40,
    alignSelf: "center",
  },
  filtersContainer: {
    marginTop: 8,
  },
  filterSection: {
    marginBottom: 8,
  },
  filterHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  clearChip: {
    alignSelf: "flex-start",
    marginTop: 4,
  },
});

export default TaskSearchBar;
