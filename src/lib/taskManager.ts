import { useNavigate } from 'react-router-dom';
import { useMusicPlayerStore } from '../store/musicPlayerStore';
import { CATALOG } from '../data/catalog';
import { mockFinances } from '../data/mockData';
import { Show, Budget, BudgetType, Note } from '../types';
import { CREW_MEMBERS } from '../data/logistics';

// Task types that AI Manager can perform
export type TaskType = 
  | 'navigate'
  | 'search_catalog'
  | 'play_music'
  | 'create_show'
  | 'create_budget'
  | 'find_finance'
  | 'create_note'
  | 'mark_task_done'
  | 'find_personnel'
  | 'find_catalog_info'
  | 'find_show_info'
  | 'unknown';

// Task interface
export interface Task {
  type: TaskType;
  params: Record<string, any>;
}

/**
 * Detects tasks in the AI's response
 * @param response The AI's response text
 * @returns A task object with type and parameters
 */
export const detectTask = (response: string): Task => {
  // Navigation tasks
  if (/navigate to|go to|open|show me the|take me to|let(?:')?s go to|I(?:')?ll take you to|moving to|switching to|heading to/i.test(response)) {
    if (/catalog|releases|tracks|albums/i.test(response)) {
      return { type: 'navigate', params: { path: '/catalog' } };
    } else if (/finance|budget|money|financial|expenses|income/i.test(response)) {
      return { type: 'navigate', params: { path: '/finance' } };
    } else if (/live|shows|tour|concerts|events/i.test(response)) {
      return { type: 'navigate', params: { path: '/live' } };
    } else if (/legal|contracts|agreements/i.test(response)) {
      return { type: 'navigate', params: { path: '/legal' } };
    } else if (/marketing|promotion/i.test(response)) {
      return { type: 'navigate', params: { path: '/marketing' } };
    } else if (/team|personnel|crew|staff/i.test(response)) {
      return { type: 'navigate', params: { path: '/team' } };
    } else if (/artist|profile/i.test(response)) {
      return { type: 'navigate', params: { path: '/artist' } };
    } else if (/notes/i.test(response)) {
      return { type: 'navigate', params: { path: '/notes' } };
    } else if (/tasks|to-do/i.test(response)) {
      return { type: 'navigate', params: { path: '/tasks' } };
    } else if (/settings/i.test(response)) {
      return { type: 'navigate', params: { path: '/settings' } };
    } else if (/dashboard|home/i.test(response)) {
      return { type: 'navigate', params: { path: '/' } };
    }
  }

  // Search catalog tasks
  if (/find|search for|look for|show me|get information about/i.test(response) && 
      /song|track|album|release/i.test(response)) {
    const songMatch = response.match(/(?:song|track|album|release)(?:\s+called|\s+titled|\s+named)?\s+["']?([^"']+)["']?/i);
    if (songMatch && songMatch[1]) {
      return { type: 'search_catalog', params: { query: songMatch[1].trim() } };
    }
  }

  // Play music tasks
  if (/play|listen to/i.test(response) && /song|track|music/i.test(response)) {
    const songMatch = response.match(/(?:play|listen to)(?:\s+the)?\s+(?:song|track|music)?\s+["']?([^"']+)["']?/i);
    if (songMatch && songMatch[1]) {
      return { type: 'play_music', params: { title: songMatch[1].trim() } };
    }
  }

  // Create show tasks
  if (/create|add|schedule|set up/i.test(response) && /show|concert|event|performance/i.test(response)) {
    const params: Record<string, any> = {};
    
    // Extract title
    const titleMatch = response.match(/(?:called|titled|named)\s+["']?([^"']+)["']?/i);
    if (titleMatch && titleMatch[1]) {
      params.title = titleMatch[1].trim();
    }
    
    // Extract date
    const dateMatch = response.match(/(?:on|for|at)\s+(\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/i);
    if (dateMatch && dateMatch[1]) {
      params.date = dateMatch[1].trim();
    }
    
    // Extract venue
    const venueMatch = response.match(/(?:at|in)\s+(?:the\s+)?["']?([^"']+)["']?(?:\s+in|venue)/i);
    if (venueMatch && venueMatch[1]) {
      params.venue = venueMatch[1].trim();
    }
    
    // Extract city
    const cityMatch = response.match(/(?:in|at)\s+(?:the\s+city\s+of\s+)?["']?([^"']+)["']?(?:\s+city)/i);
    if (cityMatch && cityMatch[1]) {
      params.city = cityMatch[1].trim();
    }
    
    return { type: 'create_show', params };
  }

  // Create budget tasks
  if (/create|add|set up/i.test(response) && /budget/i.test(response)) {
    const params: Record<string, any> = {};
    
    // Extract budget type
    if (/release budget/i.test(response)) {
      params.type = 'release';
    } else if (/show budget/i.test(response)) {
      params.type = 'show';
    } else if (/tour budget/i.test(response)) {
      params.type = 'tour';
    } else {
      params.type = 'release'; // Default
    }
    
    // Extract title
    const titleMatch = response.match(/(?:called|titled|named|for)\s+["']?([^"']+)["']?/i);
    if (titleMatch && titleMatch[1]) {
      params.title = titleMatch[1].trim();
    }
    
    return { type: 'create_budget', params };
  }

  // Create note tasks
  if (/create|add|make|write|take|jot down/i.test(response) && 
      /note|meeting note|memo|reminder/i.test(response)) {
    const params: Record<string, any> = {};
    
    // Determine note category
    if (/meeting note|meeting minutes|meeting summary/i.test(response)) {
      params.category = 'meeting';
    } else if (/todo|to-do|task|reminder/i.test(response)) {
      params.category = 'todo';
    } else if (/idea|concept|thought/i.test(response)) {
      params.category = 'idea';
    } else {
      params.category = 'other';
    }
    
    // Extract content
    let content = '';
    
    // Try to find content in quotes
    const contentMatch = response.match(/(?:with|containing|that says|saying|with text|with content|content)?\s+["']([^"']+)["']/i);
    if (contentMatch && contentMatch[1]) {
      content = contentMatch[1].trim();
    } else {
      // Try to find content after specific phrases
      const phraseMatches = [
        /(?:with text|with content|content|saying|that says)\s+(.*?)(?:\.|\n|$)/i,
        /(?:create|add|make|write|take|jot down)\s+(?:a|the)?\s+(?:note|meeting note|memo|reminder)\s+(.*?)(?:\.|\n|$)/i,
        /(?:create|add|make|write|take|jot down)\s+(?:a|the)?\s+(?:note|meeting note|memo|reminder)\s+(?:with|containing|that says|saying)?\s+(.*?)(?:\.|\n|$)/i
      ];
      
      for (const regex of phraseMatches) {
        const match = response.match(regex);
        if (match && match[1] && match[1].length > 5) { // Ensure we have meaningful content
          content = match[1].trim();
          break;
        }
      }
    }
    
    // If we still don't have content, use a default
    if (!content || content.length < 5) {
      content = "New note";
    }
    
    params.content = content;
    return { type: 'create_note', params };
  }

  // Mark task as done
  if (/mark|complete|finish|check off|set|update/i.test(response) && 
      /task|todo|to-do|item/i.test(response) && 
      /done|complete|completed|finished|as done/i.test(response)) {
    const params: Record<string, any> = {};
    
    // Try to extract task title or ID
    const taskMatch = response.match(/(?:task|todo|to-do|item)\s+(?:titled|called|named)?\s+["']?([^"']+)["']?/i);
    if (taskMatch && taskMatch[1]) {
      params.taskTitle = taskMatch[1].trim();
    }
    
    // Check if it's about marking all tasks as done
    if (/all|every|pending/i.test(response)) {
      params.markAll = true;
    }
    
    return { type: 'mark_task_done', params };
  }

  // Find personnel information
  if (/find|show|get|tell me about|who is|what is|how many/i.test(response) && 
      /personnel|crew|team member|staff|tour manager|sound engineer|lighting|technician/i.test(response)) {
    const params: Record<string, any> = {};
    
    // Check if looking for specific role
    if (/sound|audio|engineer/i.test(response)) {
      params.role = 'sound';
    } else if (/light|lighting/i.test(response)) {
      params.role = 'lighting';
    } else if (/stage/i.test(response)) {
      params.role = 'stage';
    } else if (/backline/i.test(response)) {
      params.role = 'backline';
    } else if (/tour manager/i.test(response)) {
      params.role = 'tour_manager';
    } else if (/production manager/i.test(response)) {
      params.role = 'production_manager';
    } else if (/security/i.test(response)) {
      params.role = 'security';
    }
    
    // Check if looking for specific person
    const nameMatch = response.match(/(?:about|who is|what is|contact for|email for|phone for|info for)\s+["']?([^"'?]+)["']?/i);
    if (nameMatch && nameMatch[1]) {
      params.name = nameMatch[1].trim();
    }
    
    // Check if looking for count
    if (/how many|count|number of/i.test(response)) {
      params.count = true;
    }
    
    return { type: 'find_personnel', params };
  }

  // Find catalog information
  if (/find|show|get|tell me about|how many|which|what/i.test(response) && 
      /catalog|song|track|album|release|songwriter|producer|genre/i.test(response)) {
    const params: Record<string, any> = {};
    
    // Check what type of information is being requested
    if (/songwriter|writer|compose|wrote/i.test(response)) {
      params.infoType = 'songwriters';
    } else if (/producer|produced/i.test(response)) {
      params.infoType = 'producers';
    } else if (/genre|style|type of music/i.test(response)) {
      params.infoType = 'genres';
    } else if (/track|song/i.test(response)) {
      params.infoType = 'tracks';
    } else if (/album|release/i.test(response)) {
      params.infoType = 'albums';
    } else {
      params.infoType = 'general';
    }
    
    // Check if looking for count
    if (/how many|count|number of/i.test(response)) {
      params.count = true;
    }
    
    // Check if looking for specific item
    const itemMatch = response.match(/(?:about|which|what is|details for|info for)\s+["']?([^"'?]+)["']?/i);
    if (itemMatch && itemMatch[1]) {
      params.item = itemMatch[1].trim();
    }
    
    return { type: 'find_catalog_info', params };
  }

  // Find show information
  if (/find|show|get|tell me about|when is|where is|how many|which|what/i.test(response) && 
      /show|concert|event|performance|tour|venue|gig/i.test(response)) {
    const params: Record<string, any> = {};
    
    // Check what type of information is being requested
    if (/venue|location|where/i.test(response)) {
      params.infoType = 'venues';
    } else if (/date|when|time/i.test(response)) {
      params.infoType = 'dates';
    } else if (/upcoming|next|future/i.test(response)) {
      params.infoType = 'upcoming';
    } else if (/past|previous|last/i.test(response)) {
      params.infoType = 'past';
    } else {
      params.infoType = 'general';
    }
    
    // Check if looking for count
    if (/how many|count|number of/i.test(response)) {
      params.count = true;
    }
    
    // Check if looking for specific location
    const locationMatch = response.match(/(?:in|at)\s+["']?([^"'?]+)["']?/i);
    if (locationMatch && locationMatch[1]) {
      params.location = locationMatch[1].trim();
    }
    
    // Check if looking for specific show
    const showMatch = response.match(/(?:about|which|what is|details for|info for)\s+["']?([^"'?]+)["']?(?:\s+show|\s+concert|\s+event|\s+performance)?/i);
    if (showMatch && showMatch[1]) {
      params.show = showMatch[1].trim();
    }
    
    return { type: 'find_show_info', params };
  }

  // Find finance information
  if (/find|show|get|what is|how much/i.test(response) && 
      /revenue|income|expense|profit|financial|money|earnings|sales/i.test(response)) {
    const params: Record<string, any> = {};
    
    // Extract time period
    if (/this month|current month/i.test(response)) {
      params.period = 'month';
    } else if (/this quarter|current quarter/i.test(response)) {
      params.period = 'quarter';
    } else if (/this year|current year/i.test(response)) {
      params.period = 'year';
    } else if (/last month|previous month/i.test(response)) {
      params.period = 'last_month';
    } else if (/last quarter|previous quarter/i.test(response)) {
      params.period = 'last_quarter';
    } else if (/last year|previous year/i.test(response)) {
      params.period = 'last_year';
    } else {
      params.period = 'all';
    }
    
    // Extract metric
    if (/revenue|income|earnings|sales/i.test(response)) {
      params.metric = 'revenue';
    } else if (/expense|cost|spending/i.test(response)) {
      params.metric = 'expenses';
    } else if (/profit|net/i.test(response)) {
      params.metric = 'profit';
    } else {
      params.metric = 'all';
    }
    
    // Check if looking for specific track or album
    const itemMatch = response.match(/(?:for|from|of)\s+["']?([^"'?]+)["']?/i);
    if (itemMatch && itemMatch[1]) {
      params.item = itemMatch[1].trim();
    }
    
    return { type: 'find_finance', params };
  }

  // If no task is detected
  return { type: 'unknown', params: {} };
};

/**
 * Executes a task based on its type and parameters
 * @param task The task to execute
 * @param navigate React Router's navigate function
 * @param playTrack Function to play a track
 * @returns A string with the result of the task execution
 */
export const executeTask = async (
  task: Task, 
  navigate: ReturnType<typeof useNavigate>,
  playTrack: (track: any) => void
): Promise<string> => {
  console.log('Executing task:', task);
  
  switch (task.type) {
    case 'navigate':
      navigate(task.params.path);
      return '';
    
    case 'search_catalog':
      const query = task.params.query.toLowerCase();
      const results = CATALOG.flatMap(album => album.tracks)
        .filter(track => track.title.toLowerCase().includes(query));
      
      if (results.length > 0) {
        const track = results[0];
        navigate(`/catalog/track/${track.id}`);
        return '';
      } else {
        return '';
      }
    
    case 'play_music':
      const title = task.params.title.toLowerCase();
      const tracks = CATALOG.flatMap(album => album.tracks)
        .filter(track => track.title.toLowerCase().includes(title));
      
      if (tracks.length > 0 && tracks[0].audioUrl) {
        const track = tracks[0];
        const album = CATALOG.find(a => a.id === track.albumId);
        if (album) {
          playTrack({
            id: track.id,
            title: track.title,
            artist: album.artist,
            duration: track.duration || '0:00',
            audioUrl: track.audioUrl
          });
        }
      }
      return '';
    
    case 'create_note':
      if (!task.params.content) {
        return '';
      }
      
      // Navigate to notes page with query parameters
      const queryParams = new URLSearchParams({
        createNote: 'true',
        content: task.params.content,
        category: task.params.category || 'meeting'
      }).toString();
      
      navigate(`/notes?${queryParams}`);
      return '';
    
    case 'mark_task_done':
      // Navigate to tasks page with query parameters
      if (task.params.markAll) {
        navigate('/tasks?markAllDone=true');
      } else if (task.params.taskTitle) {
        navigate(`/tasks?markTaskDone=${encodeURIComponent(task.params.taskTitle)}`);
      } else {
        navigate('/tasks');
      }
      return '';
    
    case 'find_personnel':
      // Navigate to team page
      navigate('/team');
      return '';
    
    case 'find_catalog_info':
      // Navigate to catalog page
      navigate('/catalog');
      return '';
    
    case 'find_show_info':
      // Navigate to live page
      navigate('/live');
      return '';
    
    case 'find_finance':
      // Navigate to finance page
      navigate('/finance');
      return '';
    
    default:
      return '';
  }
};