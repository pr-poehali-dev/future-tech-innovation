import type { ReactNode } from "react"

export interface FeatureCard {
  icon: string
  title: string
  description: string
}

export interface TestimonialCard {
  name: string
  role: string
  text: string
}

export interface Section {
  id: string
  title: string
  subtitle?: ReactNode
  content?: string
  showButton?: boolean
  buttonText?: string
  cards?: FeatureCard[]
  testimonials?: TestimonialCard[]
}

export interface SectionProps extends Section {
  isActive: boolean
}