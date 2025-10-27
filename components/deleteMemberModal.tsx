"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { removeMember } from "@/app/controllers/membersController";

type DeleteMemberModalProps = {
    memberId: string;
    memberName?: string;
    isOpen: boolean;
    onClose: () => void;
    // onDeleteSuccess?: () => void;
};

export default function DeleteMemberModal({
    memberId,
    memberName,
    isOpen,
    onClose,
    // onDeleteSuccess,
}: DeleteMemberModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await removeMember(memberId);
            console.log("✅ Membre supprimé avec succès");
            
            // Appeler le callback de succès si fourni
            // if (onDeleteSuccess) {
            //     onDeleteSuccess();
            // }
            
            onClose();
        } catch (error) {
            console.error("❌ Erreur lors de la suppression du membre:", error);
            alert("Une erreur est survenue lors de la suppression.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex justify-center items-center"
            style={{ zIndex: 9999 }}
        >
            <Card className="w-full max-w-md mx-4 border-red-200 shadow-xl">
                <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <div>
                                <CardTitle className="text-xl text-red-900">
                                    Supprimer ce membre
                                </CardTitle>
                                <CardDescription className="mt-1">
                                    Cette action est irréversible
                                </CardDescription>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            disabled={isDeleting}
                            className="hover:bg-gray-100"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Message d'avertissement */}
                    <div className="space-y-4">
                        <p className="text-sm text-gray-700">
                            Vous êtes sur le point de supprimer définitivement{" "}
                            {memberName ? (
                                <span className="font-semibold text-gray-900">
                                    {memberName}
                                </span>
                            ) : (
                                "ce membre"
                            )}{" "}
                            de votre arbre généalogique.
                        </p>

                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                            <p className="text-sm font-medium text-red-900">
                                ⚠️ Conséquences de cette action :
                            </p>
                            <ul className="text-sm text-red-800 space-y-1 ml-4 list-disc">
                                <li>Toutes les données personnelles seront perdues</li>
                                <li>Les liens familiaux avec ce membre seront supprimés</li>
                                <li>Les photos et documents associés seront effacés</li>
                                <li>Cette action ne peut pas être annulée</li>
                            </ul>
                        </div>
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isDeleting}
                            className="hover:bg-gray-100"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? (
                                <>
                                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                    Suppression...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer définitivement
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}