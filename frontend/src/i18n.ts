import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      app_title: 'Web Agent Swarm',
      app_subtitle: 'An LLM-powered, browser-based, multi-capability agent system.',
      goal_label: 'Enter your goal:',
      select_goal_label: 'Select a predefined goal:',
      goal_placeholder: 'e.g., Draw a red square or Create a 3D scene with a red cube',
      running_button: 'Running...',
      execute_button: 'Execute Goal',
      control_panel_title: 'Control Panel',
      logs_title: 'Logs',
      canvas_title: '2D Canvas',
    },
  },
  zh: {
    translation: {
      app_title: '网络智能体蜂群',
      app_subtitle: '一个由大型语言模型驱动的、基于浏览器的、多能力智能体系统。',
      goal_label: '输入您的目标：',
      select_goal_label: '选择一个预设目标：',
      goal_placeholder: '例如：画一个红色的正方形 或 创建一个包含红色立方体的 3D 场景',
      running_button: '执行中...',
      execute_button: '执行目标',
      control_panel_title: '控制面板',
      logs_title: '日志',
      canvas_title: '2D 画布',
    },
  },
};

i18n
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources,
    lng: 'zh', // default language
    fallbackLng: 'en',

    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

  export default i18n;
