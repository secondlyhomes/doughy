// src/features/assistant/components/actions-tab-constants.ts
// Constants for ActionsTab

import {
  Zap,
  Target,
  Calculator,
  FileText,
  MessageCircle,
  PenTool,
  CheckSquare,
  Search,
  Share2,
  FilePlus,
  GitBranch,
  Sliders,
} from 'lucide-react-native';
import { ActionId } from '../actions/catalog';

// Icon mapping for actions
export const ACTION_ICONS: Record<ActionId, React.ComponentType<any>> = {
  update_stage: GitBranch,
  set_next_action: Target,
  create_task: CheckSquare,
  add_note: MessageCircle,
  summarize_event: FileText,
  extract_facts: Search,
  run_underwrite_check: Calculator,
  update_assumption: Sliders,
  generate_seller_report: Share2,
  generate_offer_packet: FilePlus,
  draft_counter_text: MessageCircle,
  prepare_esign_envelope: PenTool,
};

// Maximum number of actions to show before "Show more" button
export const MAX_VISIBLE_ACTIONS = 6;
