"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Dumbbell,
  UtensilsCrossed,
  Users,
  Home,
  ScanBarcode,
  Copy,
  Flame,
  ChevronRight,
  ChevronLeft,
  Zap,
  X,
  Sparkles,
  Target,
  Play,
  Pause,
  Square,
  Camera,
  Check,
  User,
  Ruler,
  Scale,
  Activity,
  Heart,
  Plus,
  Clock,
  TrendingUp,
  Award,
  Trash2,
  RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"

// Fire Aurora Colors
const COLORS = {
  fire: "#DC2626",
  orange: "#F97316", 
  yellow: "#FBBF24",
  ember: "#EF4444",
}

interface UserProfile {
  name: string
  gender: "male" | "female" | "other"
  age: number
  weight: number
  height: number
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "athlete"
  goal: "loss" | "gain" | "maintain"
}

interface MealLog {
  id: string
  name: string
  calories: number
  time: string
  date: string
}

interface ExerciseSet {
  weight: number
  reps: number
}

interface Exercise {
  name: string
  sets: ExerciseSet[]
}

interface WorkoutSession {
  id: string
  date: string
  duration: number
  exercises: Exercise[]
  totalVolume: number
}

interface PersonalBest {
  exercise: string
  weight: number
  date: string
}

interface UserData {
  profile: UserProfile | null
  workoutStreak: number
  mealLogs: MealLog[]
  workoutHistory: WorkoutSession[]
  personalBests: PersonalBest[]
  lastWorkoutDate: string | null
  isOnboarded: boolean
}

const DEFAULT_USER: UserData = {
  profile: null,
  workoutStreak: 0,
  mealLogs: [],
  workoutHistory: [],
  personalBests: [],
  lastWorkoutDate: null,
  isOnboarded: false,
}

// Calculate BMI
function calculateBMI(weight: number, height: number): number {
  const heightInMeters = height / 100
  return weight / (heightInMeters * heightInMeters)
}

// Calculate Ideal Weight using Devine Formula
function calculateIdealWeight(height: number, gender: "male" | "female" | "other"): number {
  const heightInInches = height / 2.54
  if (gender === "male") {
    return 50 + 2.3 * (heightInInches - 60)
  } else {
    return 45.5 + 2.3 * (heightInInches - 60)
  }
}

// Calculate TDEE
function calculateTDEE(profile: UserProfile): number {
  let bmr: number
  if (profile.gender === "male") {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5
  } else {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161
  }

  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    athlete: 1.9,
  }

  let tdee = bmr * multipliers[profile.activityLevel]

  if (profile.goal === "loss") {
    tdee -= 500
  } else if (profile.goal === "gain") {
    tdee += 300
  }

  return Math.round(tdee)
}

// Get BMI Category
function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: "Underweight", color: COLORS.yellow }
  if (bmi < 25) return { label: "Normal", color: "#22C55E" }
  if (bmi < 30) return { label: "Overweight", color: COLORS.orange }
  return { label: "Obese", color: COLORS.fire }
}

// Predefined exercises for Hevy-style tracking
const EXERCISE_LIST = [
  "Barbell Bench Press",
  "Incline Dumbbell Press",
  "Dumbbell Flyes",
  "Barbell Squat",
  "Leg Press",
  "Romanian Deadlift",
  "Lat Pulldown",
  "Barbell Row",
  "Seated Cable Row",
  "Overhead Press",
  "Lateral Raises",
  "Face Pulls",
  "Barbell Curl",
  "Tricep Pushdown",
  "Hammer Curls",
  "Leg Extension",
  "Leg Curl",
  "Calf Raises",
]

export default function AuraFitFire() {
  const [userData, setUserData] = useState<UserData>(DEFAULT_USER)
  const [activeTab, setActiveTab] = useState<"home" | "workout" | "eat" | "social">("home")
  const [mounted, setMounted] = useState(false)
  
  // Questionnaire state
  const [questionnaireStep, setQuestionnaireStep] = useState(0)
  const [formData, setFormData] = useState<Partial<UserProfile>>({})
  
  // Overlay states
  const [showMealModal, setShowMealModal] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showToast, setShowToast] = useState<string | null>(null)
  
  // Meal Modal state
  const [mealName, setMealName] = useState("")
  const [mealCalories, setMealCalories] = useState("")
  
  // Workout Session state (Hevy-style)
  const [showWorkoutSession, setShowWorkoutSession] = useState(false)
  const [workoutTime, setWorkoutTime] = useState(0)
  const [isWorkoutPaused, setIsWorkoutPaused] = useState(false)
  const [currentExercises, setCurrentExercises] = useState<Exercise[]>([])
  const [showExercisePicker, setShowExercisePicker] = useState(false)
  const [currentSetInput, setCurrentSetInput] = useState<{ exerciseIndex: number; weight: string; reps: string } | null>(null)

  // Load from localStorage
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("aurafit-fire-data-v2")
    if (stored) {
      const parsed = JSON.parse(stored) as UserData
      // Check if streak should be maintained (worked out yesterday or today)
      const today = new Date().toDateString()
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      if (parsed.lastWorkoutDate && parsed.lastWorkoutDate !== today && parsed.lastWorkoutDate !== yesterday) {
        parsed.workoutStreak = 0
      }
      setUserData(parsed)
    }
  }, [])

  // Save to localStorage
  useEffect(() => {
    if (mounted && userData.isOnboarded) {
      localStorage.setItem("aurafit-fire-data-v2", JSON.stringify(userData))
    }
  }, [userData, mounted])

  // Workout timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (showWorkoutSession && !isWorkoutPaused) {
      interval = setInterval(() => {
        setWorkoutTime((prev) => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [showWorkoutSession, isWorkoutPaused])

  // Toast auto-dismiss
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleCompleteOnboarding = () => {
    if (!formData.name || !formData.gender || !formData.age || !formData.weight || !formData.height || !formData.activityLevel || !formData.goal) return
    
    const profile: UserProfile = {
      name: formData.name,
      gender: formData.gender,
      age: formData.age,
      weight: formData.weight,
      height: formData.height,
      activityLevel: formData.activityLevel,
      goal: formData.goal,
    }

    setUserData({
      ...DEFAULT_USER,
      profile,
      isOnboarded: true,
      workoutStreak: 1,
    })
  }

  // Meal logging
  const addMeal = useCallback((name: string, calories: number) => {
    const newMeal: MealLog = {
      id: Date.now().toString(),
      name,
      calories,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      date: new Date().toDateString(),
    }
    setUserData((prev) => ({
      ...prev,
      mealLogs: [...prev.mealLogs, newMeal],
    }))
    setShowToast(`+${calories} kcal logged`)
  }, [])

  const handleLogMeal = () => {
    if (!mealName.trim() || !mealCalories) return
    addMeal(mealName.trim(), parseInt(mealCalories))
    setMealName("")
    setMealCalories("")
    setShowMealModal(false)
  }

  const handleQuickScan = () => {
    setShowScanner(true)
  }

  const handleScanComplete = () => {
    setShowScanner(false)
    const randomCal = Math.floor(Math.random() * 300) + 200
    addMeal("Scanned Food Item", randomCal)
  }

  const handleSmartCopy = () => {
    // Copy yesterday's meals
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    const yesterdayMeals = userData.mealLogs.filter((m) => m.date === yesterday)
    if (yesterdayMeals.length > 0) {
      yesterdayMeals.forEach((meal) => {
        addMeal(meal.name, meal.calories)
      })
      setShowToast(`Copied ${yesterdayMeals.length} meals from yesterday`)
    } else {
      addMeal("Yesterday's Meals", 500)
    }
  }

  // Workout session (Hevy-style)
  const startNewWorkout = () => {
    setShowWorkoutSession(true)
    setWorkoutTime(0)
    setIsWorkoutPaused(false)
    setCurrentExercises([])
  }

  const addExerciseToWorkout = (exerciseName: string) => {
    setCurrentExercises((prev) => [...prev, { name: exerciseName, sets: [] }])
    setShowExercisePicker(false)
  }

  const addSetToExercise = (exerciseIndex: number, weight: number, reps: number) => {
    setCurrentExercises((prev) => {
      const updated = [...prev]
      updated[exerciseIndex].sets.push({ weight, reps })
      return updated
    })
    setCurrentSetInput(null)
  }

  const removeSetFromExercise = (exerciseIndex: number, setIndex: number) => {
    setCurrentExercises((prev) => {
      const updated = [...prev]
      updated[exerciseIndex].sets.splice(setIndex, 1)
      return updated
    })
  }

  const removeExercise = (exerciseIndex: number) => {
    setCurrentExercises((prev) => prev.filter((_, i) => i !== exerciseIndex))
  }

  const calculateVolume = (exercises: Exercise[]) => {
    return exercises.reduce((total, exercise) => {
      return total + exercise.sets.reduce((setTotal, set) => setTotal + set.weight * set.reps, 0)
    }, 0)
  }

  const handleEndWorkout = () => {
    const totalVolume = calculateVolume(currentExercises)
    const today = new Date().toDateString()
    
    // Check for personal bests
    const newPBs: PersonalBest[] = []
    currentExercises.forEach((exercise) => {
      const maxWeight = Math.max(...exercise.sets.map((s) => s.weight), 0)
      if (maxWeight > 0) {
        const existingPB = userData.personalBests.find((pb) => pb.exercise === exercise.name)
        if (!existingPB || maxWeight > existingPB.weight) {
          newPBs.push({ exercise: exercise.name, weight: maxWeight, date: today })
        }
      }
    })

    const session: WorkoutSession = {
      id: Date.now().toString(),
      date: today,
      duration: workoutTime,
      exercises: currentExercises,
      totalVolume,
    }

    setUserData((prev) => {
      const wasYesterday = prev.lastWorkoutDate === new Date(Date.now() - 86400000).toDateString()
      const wasToday = prev.lastWorkoutDate === today
      
      return {
        ...prev,
        workoutHistory: [...prev.workoutHistory, session],
        workoutStreak: wasYesterday || wasToday ? prev.workoutStreak + (wasToday ? 0 : 1) : 1,
        lastWorkoutDate: today,
        personalBests: [
          ...prev.personalBests.filter((pb) => !newPBs.find((npb) => npb.exercise === pb.exercise)),
          ...newPBs,
        ],
      }
    })

    setShowWorkoutSession(false)
    setWorkoutTime(0)
    setCurrentExercises([])
    
    if (newPBs.length > 0) {
      setShowToast(`Workout complete! ${newPBs.length} new PR${newPBs.length > 1 ? "s" : ""}!`)
    } else {
      setShowToast(`Workout complete! ${totalVolume.toLocaleString()}kg total volume`)
    }
  }

  // Calculated values
  const tdee = userData.profile ? calculateTDEE(userData.profile) : 2200
  const bmi = userData.profile ? calculateBMI(userData.profile.weight, userData.profile.height) : 0
  const idealWeight = userData.profile ? calculateIdealWeight(userData.profile.height, userData.profile.gender) : 0
  const bmiCategory = getBMICategory(bmi)
  
  // Today's stats
  const today = new Date().toDateString()
  const todayMeals = userData.mealLogs.filter((m) => m.date === today)
  const consumedCalories = todayMeals.reduce((sum, m) => sum + m.calories, 0)
  const todayWorkouts = userData.workoutHistory.filter((w) => w.date === today)
  const exerciseCalories = todayWorkouts.reduce((sum, w) => sum + Math.round(w.duration * 0.15), 0)
  const remaining = tdee - consumedCalories + exerciseCalories

  // Macros (estimated from calories)
  const macros = {
    protein: { current: Math.round(consumedCalories * 0.065), goal: Math.round(tdee * 0.08) },
    carbs: { current: Math.round(consumedCalories * 0.13), goal: Math.round(tdee * 0.15) },
    fat: { current: Math.round(consumedCalories * 0.04), goal: Math.round(tdee * 0.045) },
  }

  // Activity feed data (streaks + PBs)
  const generateActivityFeed = () => {
    const activities: Array<{ user: string; action: string; detail?: string; time: string; type: "streak" | "pb" | "workout" }> = []
    
    // Add user's recent PBs
    userData.personalBests.slice(-3).forEach((pb) => {
      activities.push({
        user: userData.profile?.name || "You",
        action: `hit a new PR in ${pb.exercise}!`,
        detail: `${pb.weight}kg`,
        time: pb.date === today ? "Today" : "Recently",
        type: "pb",
      })
    })

    // Add streak celebration
    if (userData.workoutStreak >= 3) {
      activities.push({
        user: userData.profile?.name || "You",
        action: `is on a ${userData.workoutStreak}-day streak!`,
        time: "Now",
        type: "streak",
      })
    }

    // Sample community activity
    const sampleActivities = [
      { user: "Shreya", action: "is on a 5-day streak!", time: "2h ago", type: "streak" as const },
      { user: "Alex", action: "hit a new PR in Leg Press!", detail: "200kg", time: "4h ago", type: "pb" as const },
      { user: "Rahul", action: "completed Push Day", detail: "45 min", time: "5h ago", type: "workout" as const },
      { user: "Priya", action: "is on a 12-day streak!", time: "6h ago", type: "streak" as const },
      { user: "Vikram", action: "hit a new PR in Bench Press!", detail: "120kg", time: "8h ago", type: "pb" as const },
    ]

    return [...activities, ...sampleActivities]
  }

  const quickMeals = [
    { name: "Oatmeal with Banana", cal: 350 },
    { name: "Grilled Chicken Salad", cal: 420 },
    { name: "Protein Shake", cal: 180 },
    { name: "Rice & Dal", cal: 380 },
    { name: "Egg Whites (6)", cal: 100 },
    { name: "Greek Yogurt", cal: 150 },
  ]

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#F97316] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Questionnaire Flow
  if (!userData.isOnboarded) {
    const questions = [
      {
        title: "What's your name?",
        subtitle: "Let's personalize your experience",
        field: (
          <input
            type="text"
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter your name"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-5 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-all"
          />
        ),
        valid: !!formData.name?.trim(),
      },
      {
        title: "What's your gender?",
        subtitle: "This helps us calculate your metabolism",
        field: (
          <div className="grid grid-cols-3 gap-4">
            {(["male", "female", "other"] as const).map((g) => (
              <button
                key={g}
                onClick={() => setFormData({ ...formData, gender: g })}
                className={`py-5 rounded-2xl border text-lg font-semibold transition-all ${
                  formData.gender === g
                    ? "bg-[#F97316] border-[#F97316] text-white shadow-[0_0_30px_rgba(249,115,22,0.4)]"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                }`}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        ),
        valid: !!formData.gender,
      },
      {
        title: "How old are you?",
        subtitle: "Age affects your daily calorie needs",
        field: (
          <div className="relative">
            <User className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40" />
            <input
              type="number"
              value={formData.age || ""}
              onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || undefined })}
              placeholder="25"
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-5 py-5 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-all"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40">years</span>
          </div>
        ),
        valid: !!formData.age && formData.age > 10 && formData.age < 100,
      },
      {
        title: "What's your current weight?",
        subtitle: "We'll track your progress from here",
        field: (
          <div className="relative">
            <Scale className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40" />
            <input
              type="number"
              value={formData.weight || ""}
              onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || undefined })}
              placeholder="70"
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-16 py-5 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-all"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40">kg</span>
          </div>
        ),
        valid: !!formData.weight && formData.weight > 20 && formData.weight < 300,
      },
      {
        title: "What's your height?",
        subtitle: "Used to calculate your ideal metrics",
        field: (
          <div className="relative">
            <Ruler className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40" />
            <input
              type="number"
              value={formData.height || ""}
              onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) || undefined })}
              placeholder="175"
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-16 py-5 text-white text-lg placeholder:text-white/30 focus:outline-none focus:border-[#F97316] focus:ring-2 focus:ring-[#F97316]/20 transition-all"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40">cm</span>
          </div>
        ),
        valid: !!formData.height && formData.height > 100 && formData.height < 250,
      },
      {
        title: "How active are you?",
        subtitle: "This determines your calorie target",
        field: (
          <div className="space-y-3">
            {([
              { value: "sedentary", label: "Sedentary", desc: "Little to no exercise" },
              { value: "light", label: "Lightly Active", desc: "1-3 days/week" },
              { value: "moderate", label: "Moderately Active", desc: "3-5 days/week" },
              { value: "active", label: "Very Active", desc: "6-7 days/week" },
              { value: "athlete", label: "Athlete", desc: "Intense training" },
            ] as const).map((level) => (
              <button
                key={level.value}
                onClick={() => setFormData({ ...formData, activityLevel: level.value })}
                className={`w-full py-4 px-5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  formData.activityLevel === level.value
                    ? "bg-[#F97316] border-[#F97316] text-white shadow-[0_0_30px_rgba(249,115,22,0.4)]"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                }`}
              >
                <div>
                  <p className="font-semibold">{level.label}</p>
                  <p className={`text-sm ${formData.activityLevel === level.value ? "text-white/80" : "text-white/40"}`}>{level.desc}</p>
                </div>
                {formData.activityLevel === level.value && <Check className="w-6 h-6" />}
              </button>
            ))}
          </div>
        ),
        valid: !!formData.activityLevel,
      },
      {
        title: "What's your goal?",
        subtitle: "We'll customize your nutrition plan",
        field: (
          <div className="space-y-4">
            {([
              { value: "loss", label: "Lose Weight", icon: TrendingUp, color: "#DC2626" },
              { value: "maintain", label: "Maintain", icon: Target, color: "#F97316" },
              { value: "gain", label: "Build Muscle", icon: Dumbbell, color: "#FBBF24" },
            ] as const).map((g) => (
              <button
                key={g.value}
                onClick={() => setFormData({ ...formData, goal: g.value })}
                className={`w-full py-6 px-6 rounded-2xl border text-left transition-all flex items-center gap-5 ${
                  formData.goal === g.value
                    ? "bg-white/10 border-[#F97316] text-white shadow-[0_0_30px_rgba(249,115,22,0.3)]"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                }`}
              >
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${g.color}20` }}
                >
                  <g.icon className="w-7 h-7" style={{ color: g.color }} />
                </div>
                <span className="text-lg font-semibold">{g.label}</span>
                {formData.goal === g.value && <Check className="w-6 h-6 ml-auto text-[#F97316]" />}
              </button>
            ))}
          </div>
        ),
        valid: !!formData.goal,
      },
    ]

    const currentQuestion = questions[questionnaireStep]
    const progress = ((questionnaireStep + 1) / questions.length) * 100

    return (
      <div className="min-h-screen text-white font-sans relative overflow-hidden">
        {/* Fire Aurora Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-black" />
          <div 
            className="absolute inset-0 opacity-50"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at 20% 20%, rgba(220, 38, 38, 0.4) 0%, transparent 50%),
                radial-gradient(ellipse 60% 80% at 80% 80%, rgba(249, 115, 22, 0.4) 0%, transparent 50%),
                radial-gradient(ellipse 50% 50% at 50% 50%, rgba(251, 191, 36, 0.2) 0%, transparent 60%)
              `,
              animation: "fireBreath 6s ease-in-out infinite",
            }}
          />
        </div>

        <div className="min-h-screen flex flex-col p-6">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/50">Step {questionnaireStep + 1} of {questions.length}</span>
              <span className="text-sm text-white/50">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #DC2626, #F97316, #FBBF24)",
                  boxShadow: "0 0 20px rgba(249, 115, 22, 0.5)"
                }}
              />
            </div>
          </div>

          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight">
              AURA<span className="text-[#F97316]">FIT</span>
              <span className="ml-2 text-[10px] font-semibold text-[#FBBF24] bg-[#FBBF24]/20 px-2 py-0.5 rounded-full align-middle">FIRE</span>
            </h1>
          </div>

          {/* Question */}
          <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
            <div className="space-y-3 mb-8">
              <h2 className="text-3xl font-bold">{currentQuestion.title}</h2>
              <p className="text-white/50">{currentQuestion.subtitle}</p>
            </div>

            {currentQuestion.field}
          </div>

          {/* Navigation */}
          <div className="flex gap-4 mt-8 max-w-md mx-auto w-full">
            {questionnaireStep > 0 && (
              <Button
                onClick={() => setQuestionnaireStep((prev) => prev - 1)}
                variant="outline"
                className="flex-1 h-14 bg-white/5 border-white/10 hover:bg-white/10 rounded-2xl text-lg"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
            )}
            {questionnaireStep < questions.length - 1 ? (
              <Button
                onClick={() => setQuestionnaireStep((prev) => prev + 1)}
                disabled={!currentQuestion.valid}
                className="flex-1 h-14 bg-[#F97316] hover:bg-[#F97316]/90 disabled:opacity-50 rounded-2xl text-lg font-semibold"
                style={{ boxShadow: currentQuestion.valid ? "0 0 30px rgba(249, 115, 22, 0.4)" : "none" }}
              >
                Next
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCompleteOnboarding}
                disabled={!currentQuestion.valid}
                className="flex-1 h-14 bg-gradient-to-r from-[#DC2626] via-[#F97316] to-[#FBBF24] hover:opacity-90 disabled:opacity-50 rounded-2xl text-lg font-bold"
                style={{ boxShadow: currentQuestion.valid ? "0 0 40px rgba(249, 115, 22, 0.5)" : "none" }}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Start My Journey
              </Button>
            )}
          </div>
        </div>

        <style jsx>{`
          @keyframes fireBreath {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.15); opacity: 0.7; }
          }
        `}</style>
      </div>
    )
  }

  // Main Dashboard
  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden relative">
      {/* Fire Aurora Animated Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-black" />
        <div 
          className="absolute inset-0 opacity-50"
          style={{
            background: `
              radial-gradient(ellipse 80% 60% at 20% 20%, rgba(220, 38, 38, 0.4) 0%, transparent 50%),
              radial-gradient(ellipse 60% 80% at 80% 80%, rgba(249, 115, 22, 0.4) 0%, transparent 50%),
              radial-gradient(ellipse 50% 50% at 50% 50%, rgba(251, 191, 36, 0.2) 0%, transparent 60%)
            `,
            animation: "fireBreath 6s ease-in-out infinite",
          }}
        />
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-[#F97316] text-white px-6 py-3 rounded-full font-semibold shadow-[0_0_30px_rgba(249,115,22,0.5)] flex items-center gap-2">
            <Check className="w-5 h-5" />
            {showToast}
          </div>
        </div>
      )}

      {/* Meal Log Modal (MFP Style) */}
      {showMealModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Log Meal</h2>
              <button
                onClick={() => setShowMealModal(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-white/50 mb-2 block">Food Name</label>
                <input
                  type="text"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  placeholder="e.g., Chicken Salad"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/30 focus:outline-none focus:border-[#F97316] transition-all"
                />
              </div>
              <div>
                <label className="text-sm text-white/50 mb-2 block">Approx Calories</label>
                <div className="relative">
                  <input
                    type="number"
                    value={mealCalories}
                    onChange={(e) => setMealCalories(e.target.value)}
                    placeholder="400"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 pr-16 text-white placeholder:text-white/30 focus:outline-none focus:border-[#F97316] transition-all"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40">kcal</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleLogMeal}
              disabled={!mealName.trim() || !mealCalories}
              className="w-full h-14 bg-[#F97316] hover:bg-[#F97316]/90 disabled:opacity-50 rounded-2xl text-lg font-semibold"
              style={{ boxShadow: mealName && mealCalories ? "0 0 30px rgba(249, 115, 22, 0.4)" : "none" }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add to Log
            </Button>
          </div>
        </div>
      )}

      {/* Scanner Overlay */}
      {showScanner && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-black/95">
          <button
            onClick={() => setShowScanner(false)}
            className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Scan Food Barcode</h2>
            <p className="text-white/50">Point camera at the barcode</p>
          </div>

          <div className="relative w-72 h-72 mb-8">
            <div className="absolute inset-0 border-2 border-white/20 rounded-3xl" />
            <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-[#F97316] rounded-tl-3xl" />
            <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-[#F97316] rounded-tr-3xl" />
            <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-[#F97316] rounded-bl-3xl" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-[#F97316] rounded-br-3xl" />
            
            <div 
              className="absolute left-4 right-4 h-1 bg-[#F97316] rounded-full shadow-[0_0_20px_#F97316]"
              style={{ animation: "scanLine 2s ease-in-out infinite" }}
            />
            
            <Camera className="absolute inset-0 m-auto w-16 h-16 text-white/20" />
          </div>

          <Button
            onClick={handleScanComplete}
            className="w-full max-w-xs h-14 bg-[#F97316] hover:bg-[#F97316]/90 rounded-2xl text-lg font-semibold"
            style={{ boxShadow: "0 0 30px rgba(249, 115, 22, 0.4)" }}
          >
            Simulate Scan
          </Button>
        </div>
      )}

      {/* Hevy-Style Workout Session */}
      {showWorkoutSession && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/98 overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-black/90 backdrop-blur-xl border-b border-white/10 p-4 z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-sm">Workout Time</p>
                <p 
                  className="font-mono text-3xl font-bold"
                  style={{ 
                    background: "linear-gradient(90deg, #DC2626, #F97316, #FBBF24)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {formatTime(workoutTime)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsWorkoutPaused(!isWorkoutPaused)}
                  className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  {isWorkoutPaused ? <Play className="w-5 h-5 ml-0.5" /> : <Pause className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleEndWorkout}
                  className="px-5 py-2.5 bg-[#DC2626] hover:bg-[#DC2626]/90 rounded-full font-semibold flex items-center gap-2"
                >
                  <Square className="w-4 h-4 fill-current" />
                  Finish
                </button>
              </div>
            </div>
          </div>

          {/* Exercise List */}
          <div className="flex-1 p-4 space-y-4 pb-32">
            {currentExercises.map((exercise, exerciseIndex) => (
              <div key={exerciseIndex} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{exercise.name}</h3>
                    <p className="text-sm text-white/50">
                      {exercise.sets.length} sets | {exercise.sets.reduce((sum, s) => sum + s.weight * s.reps, 0).toLocaleString()}kg volume
                    </p>
                  </div>
                  <button
                    onClick={() => removeExercise(exerciseIndex)}
                    className="text-white/30 hover:text-[#DC2626] transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Sets Table */}
                <div className="p-4 space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs text-white/40 font-medium px-2">
                    <span className="col-span-2">SET</span>
                    <span className="col-span-4">WEIGHT</span>
                    <span className="col-span-4">REPS</span>
                    <span className="col-span-2"></span>
                  </div>
                  
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="grid grid-cols-12 gap-2 items-center bg-white/5 rounded-xl p-2">
                      <span className="col-span-2 text-center font-bold text-[#F97316]">{setIndex + 1}</span>
                      <span className="col-span-4 text-center font-mono">{set.weight}kg</span>
                      <span className="col-span-4 text-center font-mono">{set.reps}</span>
                      <button
                        onClick={() => removeSetFromExercise(exerciseIndex, setIndex)}
                        className="col-span-2 text-white/30 hover:text-[#DC2626] transition-colors flex justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {/* Add Set Row */}
                  {currentSetInput?.exerciseIndex === exerciseIndex ? (
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <span className="col-span-2 text-center font-bold text-white/40">{exercise.sets.length + 1}</span>
                      <input
                        type="number"
                        value={currentSetInput.weight}
                        onChange={(e) => setCurrentSetInput({ ...currentSetInput, weight: e.target.value })}
                        placeholder="kg"
                        className="col-span-4 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-center font-mono text-sm focus:outline-none focus:border-[#F97316]"
                        autoFocus
                      />
                      <input
                        type="number"
                        value={currentSetInput.reps}
                        onChange={(e) => setCurrentSetInput({ ...currentSetInput, reps: e.target.value })}
                        placeholder="reps"
                        className="col-span-4 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-center font-mono text-sm focus:outline-none focus:border-[#F97316]"
                      />
                      <button
                        onClick={() => {
                          if (currentSetInput.weight && currentSetInput.reps) {
                            addSetToExercise(exerciseIndex, parseFloat(currentSetInput.weight), parseInt(currentSetInput.reps))
                          }
                        }}
                        disabled={!currentSetInput.weight || !currentSetInput.reps}
                        className="col-span-2 text-[#F97316] hover:text-[#FBBF24] disabled:text-white/20 transition-colors flex justify-center"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setCurrentSetInput({ exerciseIndex, weight: "", reps: "" })}
                      className="w-full py-3 border border-dashed border-white/20 rounded-xl text-white/50 hover:text-white hover:border-[#F97316] transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Set
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Add Exercise Button */}
            <button
              onClick={() => setShowExercisePicker(true)}
              className="w-full py-5 bg-white/5 backdrop-blur-xl border border-dashed border-white/20 rounded-2xl text-white/70 hover:text-white hover:border-[#F97316] transition-all flex items-center justify-center gap-3"
            >
              <Plus className="w-5 h-5" />
              Add Exercise
            </button>

            {/* Total Volume */}
            {currentExercises.length > 0 && (
              <div className="bg-gradient-to-r from-[#DC2626]/20 via-[#F97316]/20 to-[#FBBF24]/20 border border-[#F97316]/30 rounded-2xl p-5 text-center">
                <p className="text-white/50 text-sm mb-1">Total Volume</p>
                <p className="font-mono text-4xl font-bold" style={{ color: COLORS.orange }}>
                  {calculateVolume(currentExercises).toLocaleString()}kg
                </p>
              </div>
            )}
          </div>

          {/* Exercise Picker Modal */}
          {showExercisePicker && (
            <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/80">
              <div className="w-full max-h-[70vh] bg-black/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-xl font-bold">Select Exercise</h3>
                  <button
                    onClick={() => setShowExercisePicker(false)}
                    className="text-white/50 hover:text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="overflow-y-auto max-h-[60vh] p-2">
                  {EXERCISE_LIST.map((exercise) => (
                    <button
                      key={exercise}
                      onClick={() => addExerciseToWorkout(exercise)}
                      className="w-full text-left p-4 hover:bg-white/10 rounded-xl transition-colors"
                    >
                      {exercise}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Glassmorphic Header */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-white/5 border-b border-white/10">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                AURA<span className="text-[#F97316]">FIT</span>
                <span className="ml-2 text-[10px] font-semibold text-[#FBBF24] bg-[#FBBF24]/20 px-2 py-0.5 rounded-full align-middle">FIRE</span>
              </h1>
              <p className="text-sm text-white/60 mt-0.5">
                Good morning, <span className="text-white font-medium">{userData.profile?.name || "Athlete"}</span>
              </p>
            </div>
            <button className="flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2.5 rounded-full hover:bg-white/10 transition-colors">
              <Flame className="w-5 h-5 text-[#F97316] drop-shadow-[0_0_8px_#F97316]" />
              <span className="font-mono font-bold">{userData.workoutStreak}</span>
              <span className="text-white/60 text-sm">day streak</span>
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 pb-44 pt-8">
        {/* HOME TAB */}
        {activeTab === "home" && (
          <div className="space-y-10">
            {/* User Stats Banner */}
            <section className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">BMI</p>
                  <p className="font-mono text-2xl font-bold" style={{ color: bmiCategory.color }}>{bmi.toFixed(1)}</p>
                  <p className="text-xs text-white/40 mt-1">{bmiCategory.label}</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Ideal Weight</p>
                  <p className="font-mono text-2xl font-bold text-[#FBBF24]">{idealWeight.toFixed(0)}</p>
                  <p className="text-xs text-white/40 mt-1">kg</p>
                </div>
                <div>
                  <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Daily Target</p>
                  <p className="font-mono text-2xl font-bold text-[#F97316]">{tdee}</p>
                  <p className="text-xs text-white/40 mt-1">kcal</p>
                </div>
              </div>
            </section>

            {/* MFP Equation */}
            <section className="space-y-6">
              <h2 className="text-xs font-bold tracking-widest text-white/50 flex items-center gap-2">
                <Target className="w-4 h-4 text-[#F97316]" />
                TODAY&apos;S GOAL
              </h2>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-8" style={{ borderColor: "rgba(249, 115, 22, 0.2)" }}>
                {/* Equation Display */}
                <div className="flex items-center justify-between text-center">
                  <div className="flex-1">
                    <p className="text-white/50 text-sm mb-2">Goal</p>
                    <p className="font-mono text-2xl sm:text-3xl font-bold">{tdee}</p>
                  </div>
                  <span className="text-2xl text-white/30 font-light">-</span>
                  <div className="flex-1">
                    <p className="text-white/50 text-sm mb-2">Food</p>
                    <p className="font-mono text-2xl sm:text-3xl font-bold text-[#DC2626] drop-shadow-[0_0_12px_rgba(220,38,38,0.5)]">{consumedCalories}</p>
                  </div>
                  <span className="text-2xl text-white/30 font-light">+</span>
                  <div className="flex-1">
                    <p className="text-white/50 text-sm mb-2">Exercise</p>
                    <p className="font-mono text-2xl sm:text-3xl font-bold text-[#FBBF24] drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">{exerciseCalories}</p>
                  </div>
                  <span className="text-2xl text-white/30 font-light">=</span>
                  <div className="flex-1">
                    <p className="text-white/50 text-sm mb-2">Left</p>
                    <p className={`font-mono text-2xl sm:text-3xl font-bold ${remaining > 0 ? "text-emerald-400" : "text-[#DC2626]"} drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]`}>{remaining}</p>
                  </div>
                </div>

                {/* Glowing Progress Ring */}
                <div className="flex justify-center">
                  <div className="relative w-48 h-48">
                    <div 
                      className="absolute inset-0 rounded-full opacity-50 blur-2xl"
                      style={{
                        background: `conic-gradient(from 0deg, #DC2626 ${Math.min((consumedCalories / tdee) * 100, 100)}%, transparent ${Math.min((consumedCalories / tdee) * 100, 100)}%)`,
                      }}
                    />
                    <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="url(#fireGradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.min((consumedCalories / tdee) * 264, 264)} 264`}
                        style={{ filter: "drop-shadow(0 0 12px #F97316)" }}
                      />
                      <defs>
                        <linearGradient id="fireGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#DC2626" />
                          <stop offset="50%" stopColor="#F97316" />
                          <stop offset="100%" stopColor="#FBBF24" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xs text-white/50 uppercase tracking-wider">Consumed</span>
                      <span className="font-mono text-3xl font-bold mt-1">{Math.round((consumedCalories / tdee) * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Actions */}
            <section className="grid grid-cols-2 gap-4">
              <Button
                onClick={() => setShowMealModal(true)}
                className="h-16 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 rounded-2xl text-base font-semibold"
              >
                <Plus className="w-5 h-5 mr-2 text-[#F97316]" />
                Log Meal
              </Button>
              <Button
                onClick={startNewWorkout}
                className="h-16 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 rounded-2xl text-base font-semibold"
              >
                <Dumbbell className="w-5 h-5 mr-2 text-[#FBBF24]" />
                New Session
              </Button>
            </section>

            {/* Recent Meals */}
            {todayMeals.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xs font-bold tracking-widest text-white/50">TODAY&apos;S MEALS</h2>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl divide-y divide-white/5">
                  {todayMeals.slice(-4).reverse().map((meal) => (
                    <div key={meal.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{meal.name}</p>
                        <p className="text-sm text-white/40">{meal.time}</p>
                      </div>
                      <span className="text-[#F97316] font-mono font-semibold">+{meal.calories} kcal</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* WORKOUT TAB */}
        {activeTab === "workout" && (
          <div className="space-y-10">
            {/* Volume Summary */}
            <section className="bg-gradient-to-br from-[#DC2626]/20 via-[#F97316]/20 to-[#FBBF24]/20 backdrop-blur-xl border border-[#F97316]/30 rounded-3xl p-6 text-center">
              <p className="text-white/50 text-sm mb-2">This Week&apos;s Volume</p>
              <p className="font-mono text-5xl font-bold" style={{ color: COLORS.orange }}>
                {userData.workoutHistory
                  .filter((w) => {
                    const weekAgo = new Date(Date.now() - 7 * 86400000)
                    return new Date(w.date) >= weekAgo
                  })
                  .reduce((sum, w) => sum + w.totalVolume, 0)
                  .toLocaleString()}kg
              </p>
              <p className="text-white/40 text-sm mt-2">{userData.workoutHistory.filter((w) => {
                const weekAgo = new Date(Date.now() - 7 * 86400000)
                return new Date(w.date) >= weekAgo
              }).length} sessions</p>
            </section>

            {/* Personal Bests */}
            {userData.personalBests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xs font-bold tracking-widest text-white/50 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#FBBF24]" />
                  PERSONAL RECORDS
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {userData.personalBests.slice(-4).map((pb, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
                      <p className="text-white/50 text-xs mb-1 truncate">{pb.exercise}</p>
                      <p className="font-mono text-2xl font-bold text-[#FBBF24]">{pb.weight}kg</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Start New Workout */}
            <section>
              <Button
                onClick={startNewWorkout}
                className="w-full h-16 bg-[#F97316] hover:bg-[#F97316]/90 rounded-2xl text-lg font-bold"
                style={{ boxShadow: "0 0 40px rgba(249, 115, 22, 0.4)" }}
              >
                <Plus className="w-6 h-6 mr-3" />
                Start New Session
              </Button>
            </section>

            {/* Workout History */}
            {userData.workoutHistory.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xs font-bold tracking-widest text-white/50">SESSION HISTORY</h2>
                <div className="space-y-3">
                  {userData.workoutHistory.slice(-5).reverse().map((session) => (
                    <div key={session.id} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold">{session.date === today ? "Today" : session.date}</p>
                          <p className="text-sm text-white/40">{session.exercises.length} exercises | {formatTime(session.duration)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-xl font-bold text-[#F97316]">{session.totalVolume.toLocaleString()}kg</p>
                          <p className="text-xs text-white/40">volume</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {session.exercises.map((ex, i) => (
                          <span key={i} className="bg-white/10 text-white/60 px-3 py-1 rounded-full text-xs">
                            {ex.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* EAT TAB */}
        {activeTab === "eat" && (
          <div className="space-y-10">
            {/* Macro Breakdown */}
            <section className="space-y-6">
              <h2 className="text-xs font-bold tracking-widest text-white/50 flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-[#FBBF24]" />
                MACROS
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { name: "Protein", ...macros.protein, color: "#DC2626" },
                  { name: "Carbs", ...macros.carbs, color: "#F97316" },
                  { name: "Fat", ...macros.fat, color: "#FBBF24" },
                ].map((macro) => (
                  <div key={macro.name} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 text-center space-y-3">
                    <div className="relative w-16 h-16 mx-auto">
                      <div className="absolute inset-0 rounded-full opacity-40 blur-xl" style={{ backgroundColor: macro.color }} />
                      <svg className="w-full h-full -rotate-90 relative z-10" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={macro.color}
                          strokeWidth="10"
                          strokeLinecap="round"
                          strokeDasharray={`${Math.min((macro.current / macro.goal) * 251, 251)} 251`}
                          style={{ filter: `drop-shadow(0 0 10px ${macro.color})` }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-mono text-sm font-bold">{Math.round((macro.current / macro.goal) * 100)}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{macro.name}</p>
                      <p className="text-xs text-white/50 mt-0.5">{macro.current}g / {macro.goal}g</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Quick Actions */}
            <section className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleQuickScan}
                className="h-16 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 rounded-2xl text-base font-semibold"
              >
                <ScanBarcode className="w-5 h-5 mr-3 text-[#DC2626] drop-shadow-[0_0_8px_#DC2626]" />
                Quick Scan
              </Button>
              <Button
                onClick={handleSmartCopy}
                className="h-16 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 rounded-2xl text-base font-semibold"
              >
                <Copy className="w-5 h-5 mr-3 text-[#FBBF24] drop-shadow-[0_0_8px_#FBBF24]" />
                Copy Yesterday
              </Button>
            </section>

            {/* Log Meal Button */}
            <section>
              <Button
                onClick={() => setShowMealModal(true)}
                className="w-full h-14 bg-[#F97316] hover:bg-[#F97316]/90 rounded-2xl text-base font-semibold"
                style={{ boxShadow: "0 0 30px rgba(249, 115, 22, 0.3)" }}
              >
                <Plus className="w-5 h-5 mr-3" />
                Log Meal
              </Button>
            </section>

            {/* Quick Meals */}
            <section className="space-y-4">
              <h2 className="text-xs font-bold tracking-widest text-white/50">QUICK ADD</h2>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl divide-y divide-white/5">
                {quickMeals.map((meal, index) => (
                  <button
                    key={index}
                    onClick={() => addMeal(meal.name, meal.cal)}
                    className="w-full flex items-center justify-between p-5 hover:bg-white/5 transition-colors"
                  >
                    <span className="text-white/80">{meal.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-white/40 text-sm">{meal.cal} cal</span>
                      <Plus className="w-5 h-5 text-[#F97316]" />
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* Today's Food History */}
            {todayMeals.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xs font-bold tracking-widest text-white/50 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  TODAY&apos;S HISTORY
                </h2>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl divide-y divide-white/5">
                  {todayMeals.map((meal) => (
                    <div key={meal.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{meal.name}</p>
                        <p className="text-sm text-white/40">{meal.time}</p>
                      </div>
                      <span className="text-[#F97316] font-mono font-semibold">+{meal.calories}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between p-4 bg-[#F97316]/10 border border-[#F97316]/30 rounded-2xl">
                  <span className="font-semibold">Total Today</span>
                  <span className="font-mono text-xl font-bold text-[#F97316]">{consumedCalories} kcal</span>
                </div>
              </section>
            )}
          </div>
        )}

        {/* SOCIAL TAB - Activity Stream */}
        {activeTab === "social" && (
          <div className="space-y-10">
            {/* Your Stats Card */}
            <section className="bg-gradient-to-br from-[#DC2626]/20 via-[#F97316]/20 to-[#FBBF24]/20 backdrop-blur-xl border border-[#F97316]/30 rounded-3xl p-6">
              <div className="flex items-center gap-4 mb-4">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{ 
                    background: "linear-gradient(135deg, #DC2626, #F97316)",
                    boxShadow: "0 0 30px rgba(249, 115, 22, 0.5)"
                  }}
                >
                  {(userData.profile?.name || "A")[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{userData.profile?.name || "Athlete"}</h3>
                  <p className="text-white/50">{userData.workoutStreak} day streak</p>
                </div>
                {userData.workoutStreak >= 7 && (
                  <div className="ml-auto">
                    <Flame className="w-10 h-10 text-[#F97316] drop-shadow-[0_0_15px_#F97316]" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-3 gap-4 text-center pt-4 border-t border-white/10">
                <div>
                  <p className="font-mono text-2xl font-bold text-[#FBBF24]">{userData.workoutHistory.length}</p>
                  <p className="text-xs text-white/50">Workouts</p>
                </div>
                <div>
                  <p className="font-mono text-2xl font-bold text-[#F97316]">{userData.personalBests.length}</p>
                  <p className="text-xs text-white/50">PRs</p>
                </div>
                <div>
                  <p className="font-mono text-2xl font-bold text-[#DC2626]">{userData.workoutStreak}</p>
                  <p className="text-xs text-white/50">Streak</p>
                </div>
              </div>
            </section>

            {/* Activity Feed */}
            <section className="space-y-4">
              <h2 className="text-xs font-bold tracking-widest text-white/50 flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#F97316]" />
                ACTIVITY STREAM
              </h2>
              <div className="space-y-4">
                {generateActivityFeed().map((activity, index) => (
                  <div
                    key={index}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex items-center gap-4"
                  >
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0"
                      style={{ 
                        background: activity.type === "streak" 
                          ? "linear-gradient(135deg, #DC2626, #F97316)"
                          : activity.type === "pb"
                          ? "linear-gradient(135deg, #FBBF24, #F97316)"
                          : "linear-gradient(135deg, #F97316, #FBBF24)",
                        boxShadow: "0 0 20px rgba(249, 115, 22, 0.4)"
                      }}
                    >
                      {activity.type === "streak" ? (
                        <Flame className="w-6 h-6" />
                      ) : activity.type === "pb" ? (
                        <Award className="w-6 h-6" />
                      ) : (
                        activity.user[0]
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">
                        <span className="text-[#F97316]">{activity.user}</span> {activity.action}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        {activity.detail && (
                          <span className="text-[#FBBF24] text-sm font-semibold">{activity.detail}</span>
                        )}
                        <span className="text-white/40 text-sm">{activity.time}</span>
                      </div>
                    </div>
                    <Heart className="w-6 h-6 text-[#DC2626] flex-shrink-0 drop-shadow-[0_0_8px_#DC2626]" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Floating START WORKOUT Button */}
      <div className="fixed bottom-24 left-4 right-4 z-40">
        <button
          onClick={startNewWorkout}
          className="w-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-2xl p-5 flex items-center justify-center gap-4 relative overflow-hidden group hover:bg-white/15 transition-all"
          style={{
            boxShadow: "0 0 40px rgba(220, 38, 38, 0.4), 0 0 80px rgba(249, 115, 22, 0.2), inset 0 1px 0 rgba(255,255,255,0.1)",
            borderColor: "rgba(220, 38, 38, 0.3)"
          }}
        >
          <div 
            className="absolute inset-0 rounded-2xl opacity-60"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(249, 115, 22, 0.4), transparent)",
              animation: "shimmer 2s infinite linear",
            }}
          />
          <span className="absolute left-5 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DC2626] opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#DC2626] shadow-[0_0_10px_#DC2626]" />
            </span>
            <span className="text-xs font-bold text-[#DC2626] tracking-wider">LIVE</span>
          </span>
          <div className="flex items-center gap-3 relative z-10">
            <Dumbbell className="w-6 h-6 text-[#F97316] drop-shadow-[0_0_8px_#F97316]" />
            <span className="text-lg font-bold text-white">START WORKOUT</span>
          </div>
          <Sparkles className="w-5 h-5 text-[#FBBF24] absolute right-5 drop-shadow-[0_0_8px_#FBBF24]" />
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/5 backdrop-blur-2xl border-t border-white/10 safe-area-inset-bottom z-50">
        <div className="flex items-center justify-around py-4 px-6">
          {[
            { icon: Home, label: "Home", id: "home" as const },
            { icon: Dumbbell, label: "Workout", id: "workout" as const },
            { icon: UtensilsCrossed, label: "Eat", id: "eat" as const },
            { icon: Users, label: "Social", id: "social" as const },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl transition-all ${
                activeTab === item.id ? "text-[#F97316]" : "text-white/40 hover:text-white/70"
              }`}
            >
              <item.icon
                className={`w-6 h-6 transition-all ${activeTab === item.id ? "drop-shadow-[0_0_12px_#F97316]" : ""}`}
                fill={activeTab === item.id ? "#F97316" : "none"}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fireBreath {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.7; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes scanLine {
          0%, 100% { top: 10%; }
          50% { top: 85%; }
        }
      `}</style>
    </div>
  )
}
