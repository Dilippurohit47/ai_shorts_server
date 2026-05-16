export interface Scene {
  duration: number;
  narration: string;
  keyword: string;
  caption:string;
}

export interface ScriptData {
  title: string;
  description: string;
  tags: string[];
  script:string;
  scenes: Scene[];
  voiceProvider:string  
}

export interface Voice {
  voiceProvider:string,
 voiceCharacter:string, 
  voiceSpeed:number,

}

export interface VideoSettings {
  language:string;
  langunageInstructions:string;
  captionsEnabled:boolean,
  aiCharacter:boolean;
  duration:number,
  voice:Voice
}





