import { selectUser, setCurrentUser } from "@/lib/redux/slices/currentUserSlice"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import {
	TreePine,
	MessageCircle,
	Search,
	Sparkles,
	Bell,
	Home,
	User,
	PinIcon,
	PinOffIcon,
	Menu,
	X,
	Users,
	LogOutIcon,
	NotebookPen
} from "lucide-react"
import { logOut } from "@/lib/firebase/firebase-authentication"
import { Button } from "./ui/button"
import Link from "next/link"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { handleGetUserName, handleGetUserNameInitials } from "@/app/helpers/userHelper"
import { selectUnreadConnectionsCount, selectUnreadCount, selectUnreadMessagesCount } from "@/lib/redux/slices/notificationSlice"
import { selectActiveTab, setActiveTab } from "@/lib/redux/slices/uiSlice"
import { selectPendingRequestsCount } from "@/lib/redux/slices/connectionsSlice"

function DesktopSidebar({
	isExpanded,
	setIsExpanded,
	isPinned,
	setIsPinned,
}: {
	isExpanded: boolean
	setIsExpanded: (expanded: boolean) => void
	isPinned: boolean
	setIsPinned: (pinned: boolean) => void
}) {
	const [showText, setShowText] = useState(isPinned)
	const currentUser = useSelector(selectUser)
	const unreadCount = useSelector(selectUnreadCount) // 🔔 toutes notifs
	const unreadMessages = useSelector(selectUnreadMessagesCount) // 📩 messages
	const unreadConnections = useSelector(selectUnreadConnectionsCount) // 👥 connexions
	const pendingConnections = useSelector(
		selectPendingRequestsCount(currentUser?.id ?? "")
	)
	const dispatch = useDispatch();
	const route = useRouter();

	const menuItems = [
		{ id: "feed", label: "Feed", icon: Home },
		{ id: "wall", label: "Mon Journal", icon: NotebookPen },
		{ id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
		{ id: "tree", label: "Mon arbre", icon: TreePine },
		{ id: "ai", label: "Suggestions IA", icon: Sparkles },
		{ id: "search", label: "Recherche", icon: Search },
		{ id: "connections", label: "Connexions", icon: Users, badge: unreadConnections },
		{ id: "messages", label: "Messages", icon: MessageCircle, badge: unreadMessages },
	]

	const handleMouseEnter = () => {
		if (!isPinned) {
			setIsExpanded(true)
			// Délai pour que la sidebar se déploie avant l'apparition du texte
			setTimeout(() => setShowText(true), 200)
		}
	}

	const handleMouseLeave = () => {
		if (!isPinned) {
			// Les textes disparaissent immédiatement
			setShowText(false)
			// La sidebar se replie après un court délai
			setTimeout(() => setIsExpanded(false), 150)
		}
	}

	const handlePinToggle = () => {
		const newPinnedState = !isPinned
		setIsPinned(newPinnedState)

		if (newPinnedState) {
			// Pin: déployer immédiatement
			setIsExpanded(true)
			setTimeout(() => setShowText(true), 200)
		} else {
			// Unpin: replier avec animation
			setShowText(false)
			setTimeout(() => setIsExpanded(false), 150)
		}
	}

	// Synchroniser showText avec isPinned au montage
	useEffect(() => {
		if (isPinned) {
			setIsExpanded(true)
			setShowText(true)
		} else {
			setShowText(false)
			setIsExpanded(false)
		}
	}, [isPinned])

	const handleLogout = () => {
		logOut();
		dispatch(setActiveTab("feed"))
		dispatch(setCurrentUser(null));
		route.push("/login");
	}

	// Condition pour afficher le texte : sidebar dépliée ET (épinglée OU texte activé)
	const shouldShowText = isExpanded && (isPinned || showText)
	const activeTab = useSelector(selectActiveTab)

	return (
		<div
			className={`hidden md:flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out ${isExpanded ? "w-64" : "w-16"
				} fixed left-0 top-0 z-40 shadow-lg`}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{/* Header */}
			<div className="p-4 border-gray-200 min-h-[73px] flex items-center">
				<div className="flex items-center justify-between w-full">
					<Button
						variant="ghost"
						size="icon"
						onClick={handlePinToggle}
						className={`h-6 w-6 flex-shrink-0 transition-all duration-200 ${shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
							}`}
					>
						{isPinned ? <PinOffIcon className="h-4 w-4" /> : <PinIcon className="h-4 w-4" />}
					</Button>
				</div>
			</div>

			{/* Menu Items */}
			<div className="flex-1 py-4">
				<nav className="space-y-2 px-2">
					{menuItems.map((item) => (
						<Link
							key={item.id}
							href={item.id === "family-settings" ? "/family-settings" : "/dashboard"}
						>
							<button
								onClick={() => {
									if (item.id !== "family-settings") {
										dispatch(setActiveTab(item.id))
									}
								}}
								className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200 ${activeTab === item.id
									? "bg-blue-100 text-blue-700"
									: "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
									}`}
							>
								{/* Icône avec pastille */}
								<div className="relative flex items-center">
									<item.icon className="h-5 w-5 flex-shrink-0" />
									{(item.badge ?? 0) > 0 && (
										<span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
											{item.badge}
										</span>
									)}
								</div>

								{/* Texte (caché si sidebar repliée) */}
								<span
									className={`whitespace-nowrap transition-all duration-200 ${shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
										}`}
								>
									{item.label}
								</span>
							</button>
						</Link>
					))}
				</nav>
			</div>
			<div>
				<button className="w-full flex items-center space-x-3 px-5 py-2 rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900" onClick={() => { handleLogout() }}>
					<LogOutIcon className="h-5 w-5 flex-shrink-0" />
					<span
						className={`whitespace-nowrap transition-all duration-200 ${shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
							}`}
					>
						Déconnexion
					</span>
				</button>
			</div>

			{/* Profile */}
			<div className="p-4 border-t border-gray-200">
				<Link href="/profile">
					<button
						className={`w-full flex items-center space-x-3 px-1 py-2 rounded-lg transition-all duration-200 ${activeTab === "profile"
							? "bg-blue-100 text-blue-700"
							: "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
							}`}
					>
						<div className="flex justify-center w-5">
							<Avatar className="h-6 w-6">
								<AvatarImage src={currentUser?.avatarUrl} />
								<AvatarFallback className="text-xs">{currentUser && handleGetUserNameInitials(currentUser)}</AvatarFallback>
							</Avatar>
						</div>
						<span
							className={`whitespace-nowrap transition-all duration-200 ${shouldShowText ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
								}`}
						>
							{currentUser && handleGetUserName(currentUser)}
						</span>
					</button>
				</Link>
			</div>
		</div>
	)
}

function MobileHeader() {
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const unreadCount = useSelector(selectUnreadCount)
	const dispatch = useDispatch();
	const activeTab = useSelector(selectActiveTab)

	const menuItems = [
		{ id: "feed", label: "Feed", icon: Home },
		{ id: "wall", label: "Wall", icon: NotebookPen },
		{ id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
		{ id: "tree", label: "Mon arbre", icon: TreePine },
		{ id: "ai", label: "Suggestions IA", icon: Sparkles },
		{ id: "search", label: "Recherche", icon: Search },
		{ id: "connections", label: "Connexions", icon: Users },
		{ id: "messages", label: "Messages", icon: MessageCircle },
	]

	const handleMenuItemClick = (tabId: string) => {
		dispatch(setActiveTab(tabId))
		setIsMenuOpen(false)
	}

	return (
		<>
			{/* Mobile Header */}
			<div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
				<div className="flex items-center space-x-3">
					<TreePine className="h-8 w-8 text-blue-600" />
					<span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
						GeneAIlogy
					</span>
				</div>
				<Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
					{isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
				</Button>
			</div>

			{isMenuOpen && (
				<div className="md:hidden bg-white border-b border-gray-200 shadow-lg">
					<nav className="py-2">
						{menuItems.map((item) => (
							<button
								key={item.id}
								onClick={() => handleMenuItemClick(item.id)}
								className={`w-full flex items-center space-x-3 px-4 py-3 transition-colors ${activeTab === item.id
									? "bg-blue-100 text-blue-700"
									: "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
									}`}
							>
								<item.icon className="h-5 w-5" />
								<span>{item.label}</span>
								{item.badge && <Badge className="ml-auto bg-red-500 text-white text-xs">{item.badge}</Badge>}
							</button>
						))}
						<Link href="/profile">
							<button className="w-full flex items-center space-x-3 px-4 py-3 transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900">
								<User className="h-5 w-5" />
								<span>Profil</span>
							</button>
						</Link>
					</nav>
				</div>
			)}
		</>
	)
}

type SidebarProps = {
	isExpanded: boolean;
	setIsExpanded: (expanded: boolean) => void;
	isPinned: boolean;
	setIsPinned: (pinned: boolean) => void;
};

export const Sidebar = ({
	isExpanded,
	setIsExpanded,
	isPinned,
	setIsPinned,
}: SidebarProps) => {

	return (
		<>
			<DesktopSidebar
				isExpanded={isExpanded}
				setIsExpanded={setIsExpanded}
				isPinned={isPinned}
				setIsPinned={setIsPinned}
			/>

			<MobileHeader />
		</>
	)
}