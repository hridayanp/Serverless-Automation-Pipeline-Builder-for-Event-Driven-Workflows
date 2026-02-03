import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../store'; // adjust if your store is elsewhere

export interface ConnectorTask {
  identifier: string;
  description: string;
  trigger: string;
  children?: {
    identifier: string;
    description: string;
  }[];
}

export interface ConnectorWorkflow {
  name: string;
  description: string;
  tasks: ConnectorTask[];
}

interface ConnectorState {
  workflows: ConnectorWorkflow[];
}

const initialState: ConnectorState = {
  workflows: [],
};

export const connectorSlice = createSlice({
  name: 'connector',
  initialState,
  reducers: {
    addConnectorWorkflow: (state, action: PayloadAction<ConnectorWorkflow>) => {
      state.workflows.push(action.payload);
    },
    clearConnectorWorkflows: (state) => {
      state.workflows = [];
    },
  },
});

// ✅ Selector
export const selectAllWorkflows = (state: RootState) =>
  state.connector.workflows;

export const { addConnectorWorkflow, clearConnectorWorkflows } =
  connectorSlice.actions;
export default connectorSlice.reducer;
