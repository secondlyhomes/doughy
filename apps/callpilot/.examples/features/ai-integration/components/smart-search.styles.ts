/**
 * Smart Search Styles
 */

import { StyleSheet } from 'react-native'

const COLORS = {
  primary: '#007AFF',
  background: '#f5f5f5',
  white: '#fff',
  border: '#e0e0e0',
  inputBg: '#f0f0f0',
  text: '#333',
  textSecondary: '#666',
  textMuted: '#999',
  disabled: '#ccc',
  sourceBg: '#f9f9f9',
}

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchContainer: {
    flexDirection: 'row', padding: 16, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  searchInput: {
    flex: 1, height: 44, paddingHorizontal: 16, backgroundColor: COLORS.inputBg,
    borderRadius: 22, fontSize: 16, marginRight: 8,
  },
  searchButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  searchButtonDisabled: { backgroundColor: COLORS.disabled },
  searchButtonText: { fontSize: 20 },
  optionsContainer: {
    flexDirection: 'row', padding: 12, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  optionButton: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16,
    backgroundColor: COLORS.inputBg, marginRight: 8,
  },
  optionButtonActive: { backgroundColor: COLORS.primary },
  optionButtonText: { fontSize: 14, fontWeight: '500', color: COLORS.textSecondary },
  optionButtonTextActive: { color: COLORS.white },
  costContainer: {
    padding: 8, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  costLabel: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
  costText: { fontSize: 12, color: COLORS.textSecondary },
  resultsList: { padding: 16 },
  resultCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  resultHeader: { flexDirection: 'row', marginBottom: 8 },
  similarityBadge: {
    backgroundColor: COLORS.primary, paddingHorizontal: 8,
    paddingVertical: 4, borderRadius: 8, marginRight: 8,
  },
  similarityText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
  categoryBadge: {
    backgroundColor: COLORS.inputBg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  categoryText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '500' },
  resultContent: { fontSize: 14, lineHeight: 20, color: COLORS.text, marginBottom: 8 },
  metadataContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  metadataText: { fontSize: 11, color: COLORS.textMuted, marginRight: 12 },
  emptyContainer: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 16, color: COLORS.textMuted },
  chatContainer: { flex: 1 },
  chatHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  chatHeaderText: { fontSize: 16, fontWeight: '600', color: '#000' },
  chatContent: { flex: 1, padding: 16, backgroundColor: COLORS.white },
  chatText: { fontSize: 16, lineHeight: 24, color: '#000' },
  sourcesContainer: {
    padding: 16, backgroundColor: COLORS.sourceBg,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  sourcesTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 12 },
  sourceCard: {
    backgroundColor: COLORS.white, borderRadius: 8, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  sourceHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  sourceNumber: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  sourceSimilarity: { fontSize: 11, color: COLORS.textMuted },
  sourceContent: { fontSize: 12, lineHeight: 18, color: COLORS.textSecondary },
})
