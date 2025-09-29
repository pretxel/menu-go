import prisma from '../../../../lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  const { categoryId } = await params;
  const dishDelete = await prisma.category.delete({
    where: { id: categoryId },
  });

  return Response.json({ id: dishDelete.id });
}
