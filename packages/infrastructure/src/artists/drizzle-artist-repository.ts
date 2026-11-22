import type {
  ArtistRepository,
  CreateArtistData,
  ListArtistsQuery,
  Page,
} from '@the-manager/application';
import { schema, type Database } from '@the-manager/db';
import type { Artist } from '@the-manager/domain';
import { and, asc, count, eq, ilike } from 'drizzle-orm';

const { artists } = schema;
type Row = schema.ArtistRow;

// Legacy rows store '' for "no value"; the domain uses null.
const orNull = (v: string | null) => (v ? v : null);

export function toArtist(row: Row): Artist {
  const created = row.createdAt ?? new Date(0);
  return {
    id: row.id,
    workspaceId: row.workspaceId,
    name: row.name,
    bio: row.bio ?? '',
    genre: row.genre ?? '',
    imageUrl: orNull(row.imageUrl),
    links: {
      spotify: orNull(row.spotifyUrl),
      appleMusic: orNull(row.appleMusicUrl),
      instagram: orNull(row.instagramUrl),
    },
    createdAt: created,
    updatedAt: row.updatedAt ?? created,
  };
}

export class DrizzleArtistRepository implements ArtistRepository {
  readonly #db: Database;

  constructor(db: Database) {
    this.#db = db;
  }

  async findById(workspaceId: string, id: string): Promise<Artist | null> {
    const [row] = await this.#db
      .select()
      .from(artists)
      .where(and(eq(artists.workspaceId, workspaceId), eq(artists.id, id)))
      .limit(1);
    return row ? toArtist(row) : null;
  }

  async list({ workspaceId, limit, offset, search }: ListArtistsQuery): Promise<Page<Artist>> {
    const where = and(
      eq(artists.workspaceId, workspaceId),
      search ? ilike(artists.name, `%${search.replace(/[\\%_]/g, '\\$&')}%`) : undefined,
    );
    const [rows, totals] = await Promise.all([
      this.#db
        .select()
        .from(artists)
        .where(where)
        .orderBy(asc(artists.name))
        .limit(limit)
        .offset(offset),
      this.#db.select({ total: count() }).from(artists).where(where),
    ]);
    return { items: rows.map(toArtist), total: totals[0]?.total ?? 0 };
  }

  async create(data: CreateArtistData): Promise<Artist> {
    const [row] = await this.#db
      .insert(artists)
      .values({
        workspaceId: data.workspaceId,
        name: data.name,
        bio: data.bio,
        genre: data.genre,
        imageUrl: data.imageUrl ?? '',
        spotifyUrl: data.links.spotify ?? '',
        appleMusicUrl: data.links.appleMusic ?? '',
        instagramUrl: data.links.instagram ?? '',
      })
      .returning();
    if (!row) throw new Error('Insert returned no row');
    return toArtist(row);
  }
}
