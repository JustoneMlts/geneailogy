import {
  Camera,
  FileText,
  Send,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { useSelector } from "react-redux";
import { selectUser } from "@/lib/redux/slices/currentUserSlice";
import { handleGetUserNameInitials } from "@/app/helpers/userHelper";
import { useEffect, useMemo, useRef, useState } from "react";
import { createFeedPost, listenPostsByUserIds } from "@/app/controllers/feedController";
import { FeedPostType, UserLink, UserType } from "@/lib/firebase/models";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/firebase";
import { FeedSkeleton } from "./feedSkeleton";
import { PostCard } from "./postCard";
import { uploadFileToStorage } from "@/lib/firebase/firebase-functions";

export const Feed = () => {
  const currentUser = useSelector(selectUser);
  const [postMessage, setPostMessage] = useState<string>("");
  const [posts, setPosts] = useState<FeedPostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);

  // 🔹 Gestion de l’upload (image ou document)
  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "document"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadFileToStorage(
        file,
        type === "image" ? "feed-images" : "feed-documents"
      );
      setSelectedFile(file);
      setFileUrl(url);
    } catch (err) {
      console.error("Erreur lors de l’upload :", err);
    }
  };

  // 🔹 Supprimer le fichier uploadé
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileUrl(null);
  };

  const acceptedConnectionsIds = useMemo(() => {
    const linksArray: UserLink[] = Array.isArray(currentUser?.links)
      ? currentUser.links
      : Object.values(currentUser?.links ?? {}) as UserLink[];

    return linksArray
      .filter(link => link.status === "accepted") // plus besoin de "link is UserLink"
      .map(link => link.userId);
  }, [currentUser?.links]);


  useEffect(() => {
    if (!currentUser?.id) return;

    const userIdsToListen = [currentUser.id, ...acceptedConnectionsIds];

    const userIdsSet = new Set(userIdsToListen);

    const unsubscribe = listenPostsByUserIds(userIdsToListen, (fetched) => {
      const filteredPosts = fetched.filter(post => userIdsSet.has(post.author.id));
      setPosts(filteredPosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser?.id, acceptedConnectionsIds]);
  // 🔹 Récupération des posts de l'utilisateur + ses amis
  useEffect(() => {
    if (!currentUser?.id) return;

    const linksArray: UserLink[] = Array.isArray(currentUser.links)
      ? currentUser.links
      : (Object.values(currentUser.links ?? []) as UserLink[]);

    const acceptedConnectionsIds = linksArray
      .filter((link) => link.status === "accepted")
      .map((link) => link.userId ?? link.senderId);
    console.log("acceptedConnectionsIds: ", acceptedConnectionsIds)
    const userIdsToListen = [currentUser.id, ...acceptedConnectionsIds];

    const unsubscribe = listenPostsByUserIds(userIdsToListen, (fetched) => {
      setPosts(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 🔹 Création d’un post
  const handleSubmitInput = async () => {
    if (!currentUser?.id || (!postMessage.trim() && !fileUrl)) return;

    const newPost: FeedPostType = {
      author: {
        id: currentUser.id,
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        avatar: currentUser.avatarUrl || "/placeholder.svg",
      },
      destinator: {
        id: currentUser.id,
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        avatar: currentUser.avatarUrl || "/placeholder.svg",
      },
      content: postMessage.trim(),
      image: selectedFile?.type.startsWith("image/") ? fileUrl ?? "" : "",
      documentUrl:
        selectedFile &&
          !selectedFile.type.startsWith("image/") &&
          fileUrl
          ? fileUrl
          : undefined,
      documentName:
        selectedFile && !selectedFile.type.startsWith("image/")
          ? selectedFile.name
          : undefined,
      createdAt: Date.now(),
      timeAgo: "À l'instant",
      likesIds: [],
      comments: [],
      privacy: "public",
      isOnWall: true,
    };

    try {
      const cleanPost = Object.fromEntries(
        Object.entries(newPost).filter(([_, v]) => v !== undefined)
      ) as FeedPostType;

      await createFeedPost(cleanPost);
      setPostMessage("");
      setSelectedFile(null);
      setFileUrl(null);
    } catch (err) {
      console.error("Erreur lors de la création du post :", err);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="min-h-screen">
        <main className="w-2/3 mx-auto">
          <div className="p-6">
            <h1 className="text-3xl font-bold mb-6 animate-slide-up">
              Fil d'actualité
            </h1>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-3 space-y-6">
                {/* Zone de création de post */}
                <Card className="shadow-md border-0 animate-slide-up animate-stagger-1 card-hover">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-4">
                      <Avatar className="animate-scale-in">
                        <AvatarImage src={currentUser?.avatarUrl} />
                        <AvatarFallback>
                          {currentUser &&
                            handleGetUserNameInitials(currentUser)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        {/* Aperçu du fichier au-dessus */}
                        {fileUrl && (
                          <div className="relative mb-3 inline-block">
                            {selectedFile?.type.startsWith("image/") ? (
                              <div className="relative inline-block">
                                <img
                                  src={fileUrl}
                                  alt="aperçu"
                                  className="rounded-lg border border-gray-200 shadow-sm max-w-28 max-h-32 object-cover"
                                />
                                {/* Bouton croix placé correctement */}
                                <button
                                  onClick={handleRemoveFile}
                                  className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition"
                                >
                                  <X className="w-3 h-3 text-gray-700" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between bg-gray-100 rounded-md px-3 py-2 border border-gray-200 relative">
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 font-medium truncate max-w-[80%]"
                                >
                                  {selectedFile?.name}
                                </a>
                                {/* Croix pour les documents aussi */}
                                <button
                                  onClick={handleRemoveFile}
                                  className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-gray-100 transition"
                                >
                                  <X className="w-3 h-3 text-gray-700" />
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Input texte */}
                        <div className="relative">
                          <Input
                            placeholder="Partagez une découverte ou une histoire familiale..."
                            className="bg-gray-100 pr-10"
                            value={postMessage}
                            onChange={(e) => setPostMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSubmitInput();
                            }}
                          />
                          <Send
                            className="absolute w-5 h-5 right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-500 cursor-pointer transition-all duration-200 ease-in-out hover:scale-110"
                            onClick={handleSubmitInput}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Boutons photo / document */}
                    <div className="flex w-full justify-center mt-4 pt-4 border-t border-gray-100">
                      <div className="flex w-1/2 items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                          onClick={() => imageInputRef.current?.click()}
                        >
                          <Camera className="h-4 w-4 mr-2" /> Photo
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                          onClick={() => docInputRef.current?.click()}
                        >
                          <FileText className="h-4 w-4 mr-2" /> Document
                        </Button>
                      </div>
                    </div>

                    {/* Inputs cachés */}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "image")}
                    />
                    <input
                      ref={docInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.txt"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, "document")}
                    />
                  </CardContent>
                </Card>

                {/* Liste des posts */}
                {loading ? (
                  <FeedSkeleton />
                ) : posts.length === 0 ? (
                  <p className="text-gray-500 text-center py-10">
                    Aucun post pour le moment.
                  </p>
                ) : (
                  posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={{
                        ...post,
                        isOnWall: post.author.id !== post.destinator.id,
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
