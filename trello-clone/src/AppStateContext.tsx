import React, { createContext, useReducer, useContext, Dispatch } from "react";
import { v1 as uuid } from "uuid";
import { findItemIndexById } from "./utils/findItemIndexById";
import { moveItem } from "./moveItem";
import { DragItem } from "./DragItem";


const appData: AppState = {
  lists: [
    {
      id: "0",
      text: "To Do",
      tasks: [{ id: "c0", text: "Generate app" }],
    },
    {
      id: "1",
      text: "In Progess",
      tasks: [{ id: "c2", text: "Learn typescript" }],
    },
    {
      id: "2",
      text: "Done",
      tasks: [{ id: "c3", text: "build a site" }],
    },
  ],
};

interface Task {
  id: string;
  text: string;
}
interface List {
  id: string;
  text: string;
  tasks: Task[];
}
export interface AppState {
  lists: List[];
}
// Define the AppStateContext
// We pass an empty object that we'll cast to AppStateContextProps to createContext function
const AppStateContext = createContext<AppStateContextProps>({} as AppStateContextProps);

// Provide the type for our context
interface AppStateContextProps {
  state: AppState;
  dispatch: Dispatch<Action>
}


// We'll define actions and reducers necessary to create new cards and components
type Action =
  // The technique we are using here is called discrimination union. we've passed two
  // interfaces separated by a |. It means that now can resolve to one of the forms that we've passed
  | {
    type: "ADD_LIST";
    payload: string;
  }
  | {
    type: "ADD_TASK";
    payload: { text: string; taskId: string };
  }
  | {
    // When we start dragging the column - we remember the original position of it and then pass
    // it as dragIndex. When we hover other columns we take their positions and use them as a hoverIndex
    type: "MOVE_LIST"
    payload: {
      dragIndex: number
      hoverIndex: number
    }
  }
  /* Unfortunately, you can only access currently dragged item data from react-dnd hooks callbacks.
  It's not enought for us. For example, when we drag the column react-dnd will create a drag preview
  that we'll move around with our cursor. This drag preview will lock like the component that we started
  to drag. We need hide the original component for that look like move the item
  We need to know the type, to know if it's a card or a column as well as to know the id of this particular item. 
  */
  | {
    type: "SET_DRAGGED_ITEM"
    payload: DragItem | undefined
  }
/*  if (action.type === "ADD_LIST") {
      return typeof action.payload -> will return "string"
    }
    */
const appStateReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case "ADD_LIST": {
      return {
        // Reducer needs to return a new instance of an object. we'll set lists field
        // to be a new array with the old lists plus new item
        ...state,
        lists: [
          ...state.lists,
          { id: uuid(), text: action.payload, tasks: [] },
        ],
      };
    } // we use curly brackets to define the block scope for our case statements
    // without those, our constants would be visible across the whole switch block
    case "ADD_TASK":
      const targetLaneIndex = findItemIndexById(
        state.lists,
        action.payload.taskId
      );
      state.lists[targetLaneIndex].tasks.push({
        id: uuid(),
        text: action.payload.text,
      });
      return { ...state };

    case "MOVE_LIST": {
      const { dragIndex, hoverIndex } = action.payload
      state.lists = moveItem(state.lists, dragIndex, hoverIndex)
      return { ...state }
    }

    case "SET_DRAGGED_ITEM": 
      return { ...state, draggedItem: action.payload }

    default:
      return state;
  }
};

export const AppStateProvider = ({ children }: React.PropsWithChildren<{}>) => {
  const [state, dispatch] = useReducer(appStateReducer, appData);
  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
};
export const useAppState = () => {
  return useContext(AppStateContext);
};
