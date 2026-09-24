import React, { useState } from "react";
import { View, ActivityIndicator, StyleSheet, Text } from "react-native";
import { Image, ImageProps, ImageContentFit } from "expo-image";

export interface CachedImageProps
  extends Omit<ImageProps, "source" | "style" | "resizeMode"> {
  uri?: string;
  style?: any;
  placeholderColor?: string;
  resizeMode?: ImageContentFit;
  priority?: "low" | "normal" | "high";
  transition?: number;
}

export function CachedImage({
  uri,
  style,
  placeholderColor = "#f0f0f0",
  resizeMode = "cover",
  priority = "normal",
  transition = 300,
  ...props
}: CachedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (!uri) {
    return <View style={[styles.errorContainer, style]} />;
  }

  return (
    <View style={[styles.container, style]}>
      {loading && (
        <View style={[styles.placeholder, { backgroundColor: placeholderColor }]}>
          <ActivityIndicator size="small" color="#999" />
        </View>
      )}

      {error ? (
        <View style={[styles.errorContainer, style]}>
          <Text style={styles.errorText}>🖼️</Text>
          <Text style={styles.errorLabel}>فشل التحميل</Text>
        </View>
      ) : (
        <Image
          source={{ uri }}
          style={[style, loading && styles.hidden]}
          transition={transition}
          contentFit={resizeMode}
          cachePolicy="memory-disk"
          priority={priority}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          {...props}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    backgroundColor: "#f0f0f0",
  },
  placeholder: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  hidden: {
    opacity: 0,
  },
  errorContainer: {
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  errorText: {
    fontSize: 24,
  },
  errorLabel: {
    fontSize: 10,
    color: "#999",
  },
});
